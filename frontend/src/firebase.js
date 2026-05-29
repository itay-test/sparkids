// Firebase is optional. If VITE_FIREBASE_API_KEY is missing or "REPLACE_ME",
// the app runs in LOCAL MODE using localStorage — no login required.

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
export const FIREBASE_ENABLED = !!(apiKey && apiKey !== "REPLACE_ME");

let _auth = null;
let _db   = null;
let _googleProvider = null;

if (FIREBASE_ENABLED) {
  try {
    const app = initializeApp({
      apiKey,
      authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId:             import.meta.env.VITE_FIREBASE_APP_ID,
    });
    _auth           = getAuth(app);
    _db             = getFirestore(app);
    _googleProvider = new GoogleAuthProvider();
    _googleProvider.setCustomParameters({ prompt: "select_account" });
  } catch (e) {
    console.warn("[firebase] init failed, switching to local mode:", e.message);
  }
}

export const auth           = _auth;
export const db             = _db;
export const googleProvider = _googleProvider;
