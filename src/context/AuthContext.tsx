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
    setToken(newToken);
    setEmail(newEmail);
  };

  const logout = async () => {
    await signOut(auth);
    setToken(null);
    setEmail(null);
    setFirebaseUser(null);
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

export const firebaseRegister = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

export const firebaseLogin = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);
