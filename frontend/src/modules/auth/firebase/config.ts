import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Firebase Web SDK config — loaded from Vite environment variables with robust fallbacks.
// These values are intentionally public (Firebase requires them in the browser).
// Security is enforced by Firebase Security Rules in the Firebase Console,
// NOT by keeping these values secret. Anyone can see them in the browser
// dev-tools. Protect your data by configuring proper Firestore & Auth rules,
// and restricting the API key by HTTP referrer in Google Cloud Console.

export const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || 'AIzaSyB-61scFUV6N7EZQG0XQYByAyCTojn3iOg',
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || 'neuronova-2245a.firebaseapp.com',
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || 'neuronova-2245a',
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || 'neuronova-2245a.firebasestorage.app',
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || '648338668647',
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || '1:648338668647:web:10fb55659ac03fcdb328c2',
  measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string) || 'G-TGYLVJHT7X',
};

// Initialize Firebase safely
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Analytics conditionally
export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Ignore analytics init error in non-supported environments
  });
}
