import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { issueBackendSession } from '../services/session';

export type UserRole = 'operator' | 'user';
export type OperatorDepartment = 'Grid Operations' | 'Infrastructure Planning' | 'Maintenance';
export type ChargingPreference = 'Evening' | 'Night' | 'Flexible';

export interface OperatorData {
  employeeId: string;
  department: OperatorDepartment;
  assignedZone: string;
}

export interface EVUserData {
  vehicleModel: string;
  batteryCapacityKwh: number;
  homeChargingAccess: boolean;
  typicalChargingTime: ChargingPreference;
}

export interface UserProfile {
  uid: string;
  role: UserRole;
  name: string;
  email: string;
  createdAt: string;
  isDemo?: boolean;
  operator_data?: OperatorData;
  user_data?: EVUserData;
}

interface AuthContextType {
  token: string | null;
  email: string | null;
  role: UserRole | null;
  profile: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  login: (token: string, profile: UserProfile) => void;
  logout: () => Promise<void>;
}

const STORAGE_KEY = 'gridsense_session_v2';
const AuthContext = createContext<AuthContextType | undefined>(undefined);

function persistSession(token: string, profile: UserProfile) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, profile }));
}

function clearPersistedSession() {
  window.localStorage.removeItem(STORAGE_KEY);
}

function readPersistedSession(): { token: string; profile: UserProfile } | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { token: string; profile: UserProfile };
  } catch {
    clearPersistedSession();
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    const persisted = readPersistedSession();
    if (persisted) {
      setToken(persisted.token);
      setEmail(persisted.profile.email);
      setRole(persisted.profile.role);
      setProfile(persisted.profile);
    }

    void Promise.all([
      import('../services/firebase'),
      import('firebase/auth'),
      import('firebase/firestore'),
    ]).then(([{ auth, db }, { onAuthStateChanged }, { doc, getDoc }]) => {
      if (cancelled) return;

      if (!auth) {
        setIsLoading(false);
        return;
      }

      unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (cancelled) return;

        if (!user) {
          setFirebaseUser(null);
          // Only clear state if there's no persisted session
          if (!readPersistedSession()) {
            setToken(null);
            setEmail(null);
            setRole(null);
            setProfile(null);
          }
          setIsLoading(false);
          return;
        }

        try {
          const idToken = await user.getIdToken();
          let resolvedProfile: UserProfile | null = null;

          if (db) {
            try {
              const snapshot = await getDoc(doc(db, 'users', user.uid));
              if (snapshot.exists()) {
                resolvedProfile = snapshot.data() as UserProfile;
              }
            } catch (error) {
              console.error('Error fetching Firestore user profile', error);
            }
          }

          if (!resolvedProfile) {
            resolvedProfile = {
              uid: user.uid,
              role: (readPersistedSession()?.profile.role || 'user') as UserRole,
              name: user.displayName || user.email?.split('@')[0] || 'GridSense User',
              email: user.email || '',
              createdAt: new Date().toISOString(),
            };
          }

          const sessionToken = await issueBackendSession(idToken, resolvedProfile);

          if (cancelled) return;
          setFirebaseUser(user);
          setToken(sessionToken);
          setEmail(resolvedProfile.email);
          setRole(resolvedProfile.role);
          setProfile(resolvedProfile);
          persistSession(sessionToken, resolvedProfile);
        } catch (error) {
          console.error('Failed to establish backend session', error);
          setFirebaseUser(null);
          setToken(null);
          setEmail(null);
          setRole(null);
          setProfile(null);
          clearPersistedSession();
        }
        setIsLoading(false);
      });
    }).catch((error) => {
      console.error('Failed to load Firebase session', error);
      if (!cancelled) setIsLoading(false);
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const login = (nextToken: string, nextProfile: UserProfile) => {
    setToken(nextToken);
    setEmail(nextProfile.email);
    setRole(nextProfile.role);
    setProfile(nextProfile);
    persistSession(nextToken, nextProfile);
  };

  const logout = async () => {
    if (firebaseUser) {
      const { auth } = await import('../services/firebase');
      const { signOut } = await import('firebase/auth');
      if (auth) await signOut(auth);
    }
    setToken(null);
    setEmail(null);
    setRole(null);
    setProfile(null);
    setFirebaseUser(null);
    clearPersistedSession();
  };

  return (
    <AuthContext.Provider value={{ token, email, role, profile, firebaseUser, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export async function firebaseLogin(email: string, password: string) {
  const { auth } = await import('../services/firebase');
  const { signInWithEmailAndPassword } = await import('firebase/auth');
  if (!auth) throw new Error('Firebase not configured');
  return signInWithEmailAndPassword(auth, email, password);
}

export async function firebaseRegisterWithData(
  email: string,
  password: string,
  profile: UserProfile,
) {
  const { auth, db } = await import('../services/firebase');
  const { createUserWithEmailAndPassword } = await import('firebase/auth');
  const { doc, setDoc } = await import('firebase/firestore');
  if (!auth || !db) throw new Error('Firebase Auth/Firestore not configured');
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const nextProfile = { ...profile, uid: credential.user.uid, email: credential.user.email || email };
  await setDoc(doc(db, 'users', credential.user.uid), nextProfile);
  return { credential, profile: nextProfile };
}
