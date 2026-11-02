// Unified navigation and API configuration for NeuroNova

// In local dev, defaults to http://localhost:5001 (or proxied).
// On Vercel / production deployment, defaults to same-origin relative URLs ('') so Vercel service rewrites handle /api and /socket.io.
export const BACKEND_URL = (
  import.meta.env.VITE_BACKEND_URL !== undefined 
    ? import.meta.env.VITE_BACKEND_URL 
    : (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
        ? ''
        : 'http://localhost:5001')
).replace(/\/$/, '');

// Internal client-side routes
export const AUTHPAGE_URL = '/';
export const HOMEPAGE_URL = '/patient';
export const CAREGIVERPAGE_URL = '/caregiver';
export const HEALTHWORKER_URL = '/healthworker';
export const NEUROMUSIC_URL = '/music';
export const NEUROGAMES_URL = '/games';

/**
 * Universal Logout Handler
 * Clears all user session tokens, Firebase auth caches, and cleanly navigates to landing/login
 */
export function performLogout() {
  try {
    localStorage.removeItem('neuronova_auth_session');
    localStorage.removeItem('neuronova_hw_session');
    // Remove all cached firebase user auth tokens
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('firebase:') || key.includes('neuronova_auth'))) {
        localStorage.removeItem(key);
      }
    }
    sessionStorage.clear();
  } catch (err) {
    console.warn('Error clearing session storage:', err);
  }
  // Hard redirect to root login screen, wiping query parameters
  window.location.href = '/';
}
