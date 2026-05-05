import { FormEvent, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, BatteryCharging, Grid2x2, Network, ShieldCheck } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import {
  EVUserData,
  OperatorData,
  UserProfile,
  UserRole,
  firebaseLogin,
  firebaseRegisterWithData,
  useAuth,
} from '../context/AuthContext';
import { db } from '../services/firebase';
import { issueBackendSession } from '../services/session';

type AuthMode = 'login' | 'signup';

const ZONES = ['Whole Bengaluru', 'Indiranagar', 'Whitefield', 'Koramangala', 'Electronic City', 'Jayanagar', 'MG Road', 'Manyata Tech Park', 'Yelahanka', 'JP Nagar', 'Hebbal', 'Banashankari', 'Airport Corridor'];
const DEPARTMENTS: OperatorData['department'][] = ['Grid Operations', 'Infrastructure Planning', 'Maintenance'];
const VEHICLE_MODELS = ['Ather 450X', 'Tata Nexon EV', 'MG ZS EV', 'Mahindra XUV400', 'BYD Atto 3', 'Other EV'];

const ROLE_META = {
  operator: {
    icon: Network,
    title: 'BESCOM Operator',
    description: 'Monitor grid load, forecast demand, and plan infrastructure',
    dashboardPath: '/dashboard/operator',
  },
  user: {
    icon: BatteryCharging,
    title: 'EV Owner',
    description: 'Find stations, avoid queues, and optimize charging time',
    dashboardPath: '/dashboard/user',
  },
} satisfies Record<UserRole, { icon: typeof Network; title: string; description: string; dashboardPath: string }>;

const ROLE_COPY = {
  operator: {
    headline: 'Prevent Grid Overload Before It Happens',
    description: 'AI-powered EV infrastructure intelligence for BESCOM. Monitor feeder stress, forecast demand, and plan charging capacity before peak conditions spill into outages.',
    bullets: [
      { label: 'Operator view', value: '24h demand curve' },
      { label: 'Planning mode', value: 'Zone expansion insights' },
      { label: 'AI output', value: 'Reason / impact / confidence' },
    ],
  },
  user: {
    headline: 'Charge Smarter, Avoid the Queue',
    description: 'Get to the best charging station faster with route guidance, queue awareness, and charging-time recommendations tuned to Bengaluru demand patterns.',
    bullets: [
      { label: 'User view', value: 'Live route + queue' },
      { label: 'Trip support', value: 'Cost and wait comparison' },
      { label: 'AI output', value: 'Best time to charge' },
    ],
  },
} satisfies Record<UserRole, { headline: string; description: string; bullets: Array<{ label: string; value: string }> }>;

function getMode(value: string | null): AuthMode {
  return value === 'signup' ? 'signup' : 'login';
}

function getFriendlyError(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'No account was found for this email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/email-already-in-use':
      return 'This email is already registered.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    default:
      return 'Authentication failed. Check your details and try again.';
  }
}

export default function Login() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [mode, setMode] = useState<AuthMode>(getMode(searchParams.get('mode')));
  const [role, setRole] = useState<UserRole>('operator');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState<OperatorData['department']>('Grid Operations');
  const [assignedZone, setAssignedZone] = useState(ZONES[1]);
  const [vehicleModel, setVehicleModel] = useState(VEHICLE_MODELS[1]);
  const [batteryCapacityKwh, setBatteryCapacityKwh] = useState('45');
  const [homeChargingAccess, setHomeChargingAccess] = useState<'Yes' | 'No'>('Yes');
  const [typicalChargingTime, setTypicalChargingTime] = useState<EVUserData['typicalChargingTime']>('Night');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMode(getMode(searchParams.get('mode')));
  }, [searchParams]);

  const setAuthMode = (nextMode: AuthMode) => {
    setSearchParams({ mode: nextMode });
    setMode(nextMode);
    setError(null);
  };

  const buildProfile = (uid: string, isDemo = false): UserProfile => ({
    uid,
    role,
    name: name || (role === 'operator' ? 'Demo Operator' : 'Demo EV User'),
    email,
    createdAt: new Date().toISOString(),
    isDemo,
    operator_data: role === 'operator'
      ? { employeeId, department, assignedZone }
      : undefined,
    user_data: role === 'user'
      ? {
          vehicleModel,
          batteryCapacityKwh: Number(batteryCapacityKwh),
          homeChargingAccess: homeChargingAccess === 'Yes',
          typicalChargingTime,
        }
      : undefined,
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const draftProfile = buildProfile('pending');
        const { credential, profile } = await firebaseRegisterWithData(email, password, draftProfile);
        const idToken = await credential.user.getIdToken();
        const sessionToken = await issueBackendSession(idToken, profile);
        login(sessionToken, profile);
        navigate(ROLE_META[profile.role].dashboardPath);
        return;
      }

      const credential = await firebaseLogin(email, password);
      const idToken = await credential.user.getIdToken();
      let existingProfile: UserProfile | null = null;
      if (db) {
        const snapshot = await getDoc(doc(db, 'users', credential.user.uid));
        if (snapshot.exists()) {
          existingProfile = snapshot.data() as UserProfile;
        }
      }
      const resolvedProfile = existingProfile || {
        ...buildProfile(credential.user.uid),
        name: name || credential.user.email?.split('@')[0] || 'GridSense User',
        email: credential.user.email || email,
      };
      const sessionToken = await issueBackendSession(idToken, resolvedProfile);
      login(sessionToken, resolvedProfile);
      navigate(ROLE_META[resolvedProfile.role].dashboardPath);
    } catch (submitError) {
      const code = submitError instanceof Error && 'code' in submitError ? String((submitError as { code?: string }).code) : '';
      setError(getFriendlyError(code));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemo = async (demoRole: UserRole) => {
    setSubmitting(true);
    setError(null);
    try {
      const profile: UserProfile = {
        uid: `demo-${demoRole}`,
        role: demoRole,
        name: demoRole === 'operator' ? 'Demo BESCOM Operator' : 'Demo EV User',
        email: demoRole === 'operator' ? 'demo.operator@gridsense.ai' : 'demo.user@gridsense.ai',
        createdAt: new Date().toISOString(),
        isDemo: true,
        operator_data: demoRole === 'operator'
          ? { employeeId: 'BESCOM-2048', department: 'Grid Operations', assignedZone: 'Whitefield' }
          : undefined,
        user_data: demoRole === 'user'
          ? {
              vehicleModel: 'Tata Nexon EV',
              batteryCapacityKwh: 45,
              homeChargingAccess: true,
              typicalChargingTime: 'Night',
            }
          : undefined,
      };
      const sessionToken = await issueBackendSession(`demo-${demoRole}-token`, profile);
      login(sessionToken, profile);
      navigate(ROLE_META[demoRole].dashboardPath);
    } catch (demoError) {
      setError(demoError instanceof Error ? demoError.message : 'Demo session could not be started.');
    } finally {
      setSubmitting(false);
    }
  };

  const ActiveRoleIcon = ROLE_META[role].icon;
  const roleCopy = ROLE_COPY[role];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B0F14] text-slate-100">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(16,185,129,0.12), transparent 30%), radial-gradient(circle at 80% 10%, rgba(56,189,248,0.16), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.02), transparent 65%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 160 160%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.85%27 numOctaves=%272%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27160%27 height=%27160%27 filter=%27url(%23n)%27/%3E%3C/svg%3E")',
        }}
      />

      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-8 lg:py-8">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="max-w-xl"
        >
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.22em] text-slate-300 transition hover:border-white/20 hover:text-white"
          >
            <ArrowLeft size={14} />
            Back to Home
          </button>
          <div className="mt-4 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.28em] text-slate-300">
            <Grid2x2 size={14} />
            GridSense AI
          </div>
          <h1 className="mt-6 text-4xl font-semibold leading-tight text-white md:text-5xl">
            {roleCopy.headline}
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-300 md:text-lg">
            {roleCopy.description}
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {roleCopy.bullets.map((item) => (
              <div key={item.label} className="rounded-3xl border border-white/8 bg-white/5 p-3 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{item.label}</p>
                <p className="mt-2 text-sm font-medium text-white md:text-base">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="rounded-[32px] border border-white/10 bg-white/6 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl md:p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">System Gateway</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{mode === 'signup' ? 'Create account' : 'Secure sign in'}</h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
              <ActiveRoleIcon size={18} />
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {(Object.keys(ROLE_META) as UserRole[]).map((item) => {
              const Icon = ROLE_META[item].icon;
              const active = role === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setRole(item)}
                  className={`rounded-3xl border p-4 text-left transition ${
                    active ? 'border-cyan-300/30 bg-cyan-300/10' : 'border-white/8 bg-[#0D131A] hover:border-white/16'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${active ? 'bg-cyan-300/12 text-cyan-200' : 'bg-white/5 text-slate-400'}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-white">{ROLE_META[item].title}</p>
                      <p className="mt-1 text-sm leading-5 text-slate-400">{ROLE_META[item].description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex rounded-full border border-white/8 bg-[#0C131B] p-1">
            {(['login', 'signup'] as AuthMode[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setAuthMode(item)}
                className={`flex-1 rounded-full px-4 py-2 text-sm transition ${mode === item ? 'bg-white text-[#0B0F14]' : 'text-slate-400'}`}
              >
                {item === 'login' ? 'Login' : 'Sign up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${mode}-${role}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22 }}
                className="space-y-4"
              >
                {mode === 'signup' && (
                  <Field label="Name">
                    <input value={name} onChange={(event) => setName(event.target.value)} required className={inputClass} placeholder="Full name" />
                  </Field>
                )}

                <div className={`grid gap-3 ${mode === 'signup' ? 'md:grid-cols-2' : ''}`}>
                  <Field label="Email">
                    <input value={email} onChange={(event) => setEmail(event.target.value)} required type="email" className={inputClass} placeholder="you@company.com" />
                  </Field>

                  <Field label="Password">
                    <input value={password} onChange={(event) => setPassword(event.target.value)} required type="password" className={inputClass} placeholder="Enter password" />
                  </Field>
                </div>

                {mode === 'signup' && role === 'operator' && (
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Employee ID">
                      <input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} required className={inputClass} placeholder="BESCOM-1024" />
                    </Field>
                    <Field label="Department">
                      <select value={department} onChange={(event) => setDepartment(event.target.value as OperatorData['department'])} className={inputClass}>
                        {DEPARTMENTS.map((item) => <option key={item}>{item}</option>)}
                      </select>
                    </Field>
                    <Field label="Assigned Zone">
                      <select value={assignedZone} onChange={(event) => setAssignedZone(event.target.value)} className={inputClass}>
                        {ZONES.map((item) => <option key={item}>{item}</option>)}
                      </select>
                    </Field>
                  </div>
                )}

                {mode === 'signup' && role === 'user' && (
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Vehicle Model">
                      <select value={vehicleModel} onChange={(event) => setVehicleModel(event.target.value)} className={inputClass}>
                        {VEHICLE_MODELS.map((item) => <option key={item}>{item}</option>)}
                      </select>
                    </Field>
                    <Field label="Battery Capacity (kWh)">
                      <input value={batteryCapacityKwh} onChange={(event) => setBatteryCapacityKwh(event.target.value)} required type="number" min="1" className={inputClass} placeholder="45" />
                    </Field>
                    <Field label="Home Charging Access">
                      <div className="grid grid-cols-2 gap-2">
                        {(['Yes', 'No'] as const).map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setHomeChargingAccess(item)}
                            className={`rounded-2xl border px-4 py-3 text-sm ${homeChargingAccess === item ? 'border-cyan-300/30 bg-cyan-300/10 text-white' : 'border-white/8 bg-[#0D131A] text-slate-400'}`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </Field>
                    <Field label="Typical Charging Time">
                      <div className="grid grid-cols-3 gap-2">
                        {(['Evening', 'Night', 'Flexible'] as EVUserData['typicalChargingTime'][]).map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setTypicalChargingTime(item)}
                            className={`rounded-2xl border px-3 py-3 text-sm ${typicalChargingTime === item ? 'border-cyan-300/30 bg-cyan-300/10 text-white' : 'border-white/8 bg-[#0D131A] text-slate-400'}`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </Field>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {error && <p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#0B0F14] transition hover:bg-slate-100 disabled:opacity-60"
            >
              <ShieldCheck size={16} />
              {submitting ? 'Processing...' : mode === 'signup' ? 'Create account' : 'Continue'}
            </button>
          </form>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => { void handleDemo('operator'); }}
              className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm font-medium text-emerald-100"
            >
              Enter as Demo Operator
            </button>
            <button
              type="button"
              onClick={() => { void handleDemo('user'); }}
              className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-medium text-cyan-100"
            >
              Enter as Demo EV User
            </button>
          </div>

          <p className="mt-5 text-center text-sm text-slate-500">
            {mode === 'signup' ? 'Already have access?' : 'Need a role-based account?'}{' '}
            <button type="button" onClick={() => setAuthMode(mode === 'signup' ? 'login' : 'signup')} className="text-cyan-200">
              {mode === 'signup' ? 'Sign in' : 'Create one'}
            </button>
            {' '}or{' '}
            <Link to="/" className="text-slate-300">return home</Link>.
          </p>
        </motion.section>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-slate-300">{label}</span>
      {children}
    </label>
  );
}

const inputClass = 'w-full rounded-2xl border border-white/8 bg-[#0D131A] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/40';
