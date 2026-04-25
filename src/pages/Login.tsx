import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, firebaseLogin, firebaseRegister } from '../context/AuthContext';

type AuthMode = 'login' | 'signup';

function getMode(mode: string | null): AuthMode {
  return mode === 'signup' ? 'signup' : 'login';
}

function getFriendlyError(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'No account found with this email. Please sign up first.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'Email already registered. Please log in instead.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export default function Login() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const mode = getMode(searchParams.get('mode'));
  const isSignup = mode === 'signup';

  useEffect(() => {
    if (!searchParams.get('mode')) {
      setSearchParams({ mode: 'login' }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const setMode = (nextMode: AuthMode) => {
    setError('');
    setSearchParams({ mode: nextMode });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const credential = isSignup
        ? await firebaseRegister(email, password)
        : await firebaseLogin(email, password);

      const idToken = await credential.user.getIdToken();
      login(idToken, credential.user.email ?? email);
      navigate('/dashboard');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setError(getFriendlyError(code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = async () => {
    setEmail('demo@gridsense.ai');
    setPassword('demo1234');
    setError('');
    setIsLoading(true);

    try {
      // Try login first; if demo account doesn't exist yet, create it
      let credential;
      try {
        credential = await firebaseLogin('demo@gridsense.ai', 'demo1234');
      } catch {
        credential = await firebaseRegister('demo@gridsense.ai', 'demo1234');
      }

      const idToken = await credential.user.getIdToken();
      login(idToken, 'demo@gridsense.ai');
      navigate('/dashboard');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setError(getFriendlyError(code));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1d4ed855,transparent_35%),linear-gradient(135deg,#07111d_0%,#0b1726_45%,#0f2740_100%)] flex items-center justify-center p-4 text-white">
      <div className="w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
          <div className="hidden lg:flex flex-col justify-between border-r border-white/10 bg-[linear-gradient(180deg,rgba(0,200,255,0.15),rgba(0,229,160,0.08))] p-10">
            <div>
              <Link to="/" className="inline-flex items-center gap-3 text-sm font-semibold text-white/80">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 text-slate-950">
                  GS
                </span>
                GridSense AI
              </Link>
              <p className="mt-10 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300/80">
                Operator Access
              </p>
              <h1 className="mt-4 max-w-lg text-5xl font-black leading-tight tracking-tight text-white">
                Sign in and open the live backend command center.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-300">
                Use the authenticated dashboard to inspect real-time demand, forecasts,
                optimization windows, alerts, simulations, ROI, and recommended expansion zones.
              </p>
            </div>

            <div className="grid gap-4 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-2xl font-bold text-emerald-300">24h</div>
                <div className="mt-1 text-slate-300">Forecast visibility per zone</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-2xl font-bold text-cyan-300">7 modules</div>
                <div className="mt-1 text-slate-300">Realtime, ROI, alerts, simulation, impact, forecast, optimization</div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="mb-8 flex items-center justify-between">
              <Link to="/" className="text-sm font-medium text-white/60 transition hover:text-white">
                Back to landing
              </Link>
              <div className="rounded-full border border-white/10 bg-white/5 p-1">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    !isSignup ? 'bg-white text-slate-950' : 'text-white/70 hover:text-white'
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isSignup ? 'bg-emerald-400 text-slate-950' : 'text-white/70 hover:text-white'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-white">
                {isSignup ? 'Create operator account' : 'Login to dashboard'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {isSignup
                  ? 'Create a new account and go straight into the live operator dashboard.'
                  : 'Use your credentials or enter the demo account to inspect the backend features.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-white/10"
                  placeholder="operator@example.com"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-white/10"
                  placeholder="Enter a secure password (min 6 chars)"
                  required
                  minLength={6}
                />
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:shadow-[0_12px_40px_rgba(34,211,238,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading
                  ? 'Please wait...'
                  : isSignup
                    ? 'Create account and continue'
                    : 'Login and open dashboard'}
              </button>
            </form>

            <div className="mt-5 space-y-4">
              <button
                type="button"
                onClick={handleDemo}
                disabled={isLoading}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continue with demo account
              </button>

              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
                <div className="font-semibold text-white">Demo credentials</div>
                <div className="mt-1">demo@gridsense.ai / demo1234</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
