// Centralized, environment-driven inter-service URLs
export const AUTHPAGE_URL = (import.meta.env.VITE_AUTHPAGE_URL as string || 'http://localhost:5174').replace(/\/$/, '');
export const HOMEPAGE_URL = (import.meta.env.VITE_HOMEPAGE_URL as string || 'http://localhost:5175').replace(/\/$/, '');
export const NEUROMUSIC_URL = (import.meta.env.VITE_NEUROMUSIC_URL as string || 'http://localhost:5177').replace(/\/$/, '');
export const NEUROGAMES_URL = (import.meta.env.VITE_NEUROGAMES_URL as string || 'http://localhost:5178').replace(/\/$/, '');
export const CAREGIVERPAGE_URL = (import.meta.env.VITE_CAREGIVERPAGE_URL as string || 'http://localhost:5179').replace(/\/$/, '');
export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string || 'http://localhost:5001').replace(/\/$/, '');
