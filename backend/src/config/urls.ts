import dotenv from 'dotenv';
dotenv.config();

// Centralized, environment-driven service URLs for backend
export const PORT = process.env.PORT || 5001;
export const BACKEND_URL = (process.env.BACKEND_URL || '').replace(/\/$/, '');

// Vercel Service binding: FRONTEND_URL is injected when deployed with Vercel Services
export const FRONTEND_URL = (process.env.FRONTEND_URL || process.env.HOMEPAGE_URL || '').replace(/\/$/, '');

export const HOMEPAGE_URL = (process.env.HOMEPAGE_URL || (FRONTEND_URL ? `${FRONTEND_URL}/patient` : '')).replace(/\/$/, '');
export const CAREGIVERPAGE_URL = (process.env.CAREGIVERPAGE_URL || (FRONTEND_URL ? `${FRONTEND_URL}/caregiver` : '')).replace(/\/$/, '');
export const NEUROMUSIC_URL = (process.env.NEUROMUSIC_URL || (FRONTEND_URL ? `${FRONTEND_URL}/music` : '')).replace(/\/$/, '');
export const NEUROGAMES_URL = (process.env.NEUROGAMES_URL || (FRONTEND_URL ? `${FRONTEND_URL}/games` : '')).replace(/\/$/, '');
export const AUTHPAGE_URL = (process.env.AUTHPAGE_URL || FRONTEND_URL || '').replace(/\/$/, '');

// Parse CORS allowed origins from ALLOWED_ORIGINS and configured service URLs
const envOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const serviceOrigins = [
  AUTHPAGE_URL,
  HOMEPAGE_URL,
  NEUROMUSIC_URL,
  NEUROGAMES_URL,
  CAREGIVERPAGE_URL,
  BACKEND_URL,
  FRONTEND_URL,
].filter(Boolean);

export const CORS_ORIGINS = [...new Set([...envOrigins, ...serviceOrigins])];
