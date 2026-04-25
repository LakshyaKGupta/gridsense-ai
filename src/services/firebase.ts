import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// ─── Firebase Config ─────────────────────────────────────────────────────────
// Fill in your Firebase project values in .env.local (see .env.example)
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if all required config values are present
const isConfigValid = Object.values(firebaseConfig).every(value => value && value.trim() !== '');

// Avoid re-initialising during hot-reload
const app = isConfigValid && getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = isConfigValid ? getAuth(app) : null;
export default app;
