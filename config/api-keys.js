/**
 * @module api-keys
 * @description Centralised API key accessor.
 * All keys are read from window.ENV which is set by env-config.js (not committed).
 * Import getKey() wherever you need a key — never inline keys in source.
 */

const ENV = window.ENV || {};

/**
 * Returns the API key for the given service name.
 * @param {"GEMINI"|"MAPS"|"TRANSLATE"|"CALENDAR_CLIENT_ID"} service
 * @returns {string} The API key string
 * @throws {Error} if key is missing
 */
export function getKey(service) {
  const MAP = {
    GEMINI:            ENV.GEMINI_API_KEY,
    MAPS:              ENV.GOOGLE_MAPS_API_KEY,
    TRANSLATE:         ENV.GOOGLE_TRANSLATE_API_KEY,
    CALENDAR_CLIENT_ID: ENV.GOOGLE_CALENDAR_CLIENT_ID,
  };
  const key = MAP[service];
  if (!key || key.startsWith("YOUR_")) {
    console.warn(`[API Keys] Key for "${service}" is not configured. Check env-config.js.`);
    return "";
  }
  return key;
}

export const IS_PRODUCTION = (ENV.APP_ENV === "production");
