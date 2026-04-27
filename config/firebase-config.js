/**
 * @module firebase-config
 * @description Initialises Firebase app, Firestore, Auth and Analytics
 * using credentials injected at runtime via window.ENV (never hardcoded).
 */

import { initializeApp }       from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore }        from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getAnalytics }        from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";

const ENV = window.ENV || {};

const firebaseConfig = {
  apiKey:            ENV.FIREBASE_API_KEY,
  authDomain:        ENV.FIREBASE_AUTH_DOMAIN,
  projectId:         ENV.FIREBASE_PROJECT_ID,
  storageBucket:     ENV.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID,
  appId:             ENV.FIREBASE_APP_ID,
  measurementId:     ENV.FIREBASE_MEASUREMENT_ID,
};

/** Singleton Firebase app */
const app = initializeApp(firebaseConfig);

/** Firestore database instance */
export const db = getFirestore(app);

/** Firebase Auth instance */
export const auth = getAuth(app);

/** Google Analytics instance */
export const analytics = getAnalytics(app);

/**
 * Signs the user in anonymously so Firestore rules allow read access.
 * Called once on app startup.
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
export async function initAnonymousAuth() {
  try {
    const credential = await signInAnonymously(auth);
    return credential;
  } catch (error) {
    console.error("[Firebase] Anonymous auth failed:", error.message);
    throw error;
  }
}

export default app;
