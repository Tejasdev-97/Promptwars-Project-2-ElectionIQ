/**
 * @module analytics
 * @description Google Analytics wrapper for tracking events
 */

export const initAnalytics = () => {
  // Assuming GA4 is initialized in index.html via script or firebase-config
  // This is a wrapper to send custom events
};

export const trackEvent = (eventName, eventParams = {}) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, eventParams);
    // console.log(`[Analytics Mock] Event: ${eventName}`, eventParams);
};
