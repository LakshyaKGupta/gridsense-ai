import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../services/firebase';

interface AuthContextType {
  token: string | null;
  email: string | null;
  firebaseUser: FirebaseUser | null;
  login: (token: string, email: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = window.localStorage.getItem('gridsense_demo_token');
    const storedEmail = window.localStorage.getItem('gridsense_demo_email');
    if (storedToken && storedEmail) {
      setToken(storedToken);
      setEmail(storedEmail);
    }

    if (!auth) {
      setIsLoading(false);
      return;
    }
    // Listen to Firebase auth state — this fires on page load & on sign-in/out
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const idToken = await user.getIdToken();
        setFirebaseUser(user);
        setToken(idToken);
        setEmail(user.email);
      } else {
        setFirebaseUser(null);
        setToken(null);
        setEmail(null);
      }
      setIsLoading(false);
    });

    return unsubscribe; // cleanup listener on unmount
  }, []);

  // Kept for backwards-compat with Login.tsx call signature
  const login = (newToken: string, newEmail: string) => {
    window.localStorage.setItem('gridsense_demo_token', newToken);
    window.localStorage.setItem('gridsense_demo_email', newEmail);
    setToken(newToken);
    setEmail(newEmail);
  };

  const logout = async () => {
    if (auth) {
      await signOut(auth);
    }
    setToken(null);
    setEmail(null);
    setFirebaseUser(null);
    window.localStorage.removeItem('gridsense_demo_token');
    window.localStorage.removeItem('gridsense_demo_email');
  };

  return (
    <AuthContext.Provider value={{ token, email, firebaseUser, login, logout, isLoading }}>
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

// ─── Exported Firebase auth helpers (used directly in Login.tsx) ──────────────

export const firebaseRegister = (email: string, password: string) => {
  if (!auth) throw new Error('Firebase not configured');
  return createUserWithEmailAndPassword(auth, email, password);
};

export const firebaseLogin = (email: string, password: string) => {
  if (!auth) throw new Error('Firebase not configured');
  return signInWithEmailAndPassword(auth, email, password);
};
