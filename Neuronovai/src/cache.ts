import { ProgressSummaryResponse } from './types.js';

interface CacheEntry {
  response: ProgressSummaryResponse;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry>();

/**
 * Generates a cache key based on patientId, local calendar date (YYYY-MM-DD), and audience.
 */
export function getCacheKey(patientId: string, audience: string = 'patient'): string {
  const dateStr = new Date().toISOString().split('T')[0];
  return `${patientId}:${dateStr}:${audience}`;
}

/**
 * Retrieves a cached summary if still valid.
 */
export function getCachedSummary(key: string): ProgressSummaryResponse | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.response;
}

/**
 * Stores a summary in cache for the rest of the day (up to 24 hours).
 */
export function setCachedSummary(key: string, response: ProgressSummaryResponse, ttlMs: number = 24 * 60 * 60 * 1000): void {
  memoryCache.set(key, {
    response,
    expiresAt: Date.now() + ttlMs,
  });
}
