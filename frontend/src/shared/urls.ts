// Unified navigation and API configuration for NeuroNova

// In local dev, Vite proxies /api and /socket.io to backend (port 5001).
// You can also override with VITE_BACKEND_URL.
export const BACKEND_URL = (
  import.meta.env.VITE_BACKEND_URL !== undefined 
    ? import.meta.env.VITE_BACKEND_URL 
    : 'http://localhost:5001'
).replace(/\/$/, '');

// Internal client-side routes (seamless SPA navigation without localhost hardcoding)
export const AUTHPAGE_URL = '/';
export const HOMEPAGE_URL = '/patient';
export const CAREGIVERPAGE_URL = '/caregiver';
export const HEALTHWORKER_URL = '/healthworker';
export const NEUROMUSIC_URL = '/music';
export const NEUROGAMES_URL = '/games';
