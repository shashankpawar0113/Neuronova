// Centralized, environment-driven inter-service URLs
export const AUTHPAGE_URL = (import.meta.env.VITE_AUTHPAGE_URL as string || '').replace(/\/$/, '');
export const HOMEPAGE_URL = (import.meta.env.VITE_HOMEPAGE_URL as string || '').replace(/\/$/, '');
export const NEUROMUSIC_URL = (import.meta.env.VITE_NEUROMUSIC_URL as string || '').replace(/\/$/, '');
export const NEUROGAMES_URL = (import.meta.env.VITE_NEUROGAMES_URL as string || '').replace(/\/$/, '');
export const CAREGIVERPAGE_URL = (import.meta.env.VITE_CAREGIVERPAGE_URL as string || '').replace(/\/$/, '');
export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string || '').replace(/\/$/, '');
