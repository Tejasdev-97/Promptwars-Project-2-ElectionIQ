/**
 * env-config.example.js
 * ─────────────────────────────────────────────────────────────────────────────
 * INSTRUCTIONS:
 *   1. Copy this file and rename it to "env-config.js" in the project root.
 *   2. Replace every placeholder value below with your actual credentials.
 *   3. env-config.js is listed in .gitignore — it will NEVER be committed.
 *   4. This file is loaded as the FIRST script in index.html so that
 *      all modules can safely read from window.ENV.
 * ─────────────────────────────────────────────────────────────────────────────
 */
window.ENV = {
  /* ── Firebase ────────────────────────────────────────────────────────────── */
  FIREBASE_API_KEY:            "YOUR_FIREBASE_API_KEY",
  FIREBASE_AUTH_DOMAIN:        "your-project.firebaseapp.com",
  FIREBASE_PROJECT_ID:         "your-firebase-project-id",
  FIREBASE_STORAGE_BUCKET:     "your-project.appspot.com",
  FIREBASE_MESSAGING_SENDER_ID:"YOUR_SENDER_ID",
  FIREBASE_APP_ID:             "YOUR_APP_ID",
  FIREBASE_MEASUREMENT_ID:     "G-XXXXXXXXXX",

  /* ── Google APIs ──────────────────────────────────────────────────────────── */
  GEMINI_API_KEY:              "YOUR_GEMINI_API_KEY",
  GOOGLE_MAPS_API_KEY:         "YOUR_GOOGLE_MAPS_API_KEY",
  GOOGLE_TRANSLATE_API_KEY:    "YOUR_TRANSLATE_API_KEY",
  GOOGLE_CALENDAR_CLIENT_ID:   "YOUR_OAUTH2_CLIENT_ID.apps.googleusercontent.com",

  /* ── App ──────────────────────────────────────────────────────────────────── */
  APP_ENV: "development"   // change to "production" when deploying
};
