import { ComputedStats, ProgressSummaryResponse } from './types.js';

/**
 * Generates a warm, human-crafted fallback summary using the pre-computed stats.
 * This guarantees that even if OpenRouter is unreachable, rate-limited, or slow,
 * the patient or caregiver receives an instant, dignified, high-quality progress card.
 */
export function generateFallbackSummary(
  stats: ComputedStats,
  audience: 'patient' | 'caregiver' = 'patient'
): ProgressSummaryResponse {
  const name = stats.patientName || 'Friend';
  const highlight = stats.highlightDimension;
  const concern = stats.concernDimension;
  const adherence = stats.routineAdherencePercent;
  const activeDays = stats.activeDaysCount;

  let summaryText = '';

  if (audience === 'caregiver') {
    summaryText = `${name} engaged consistently across ${activeDays} days this week, showing their strongest performance in ${highlight}. Daily routine adherence is currently at ${adherence}%, indicating steady participation in daily activities.`;
    if (concern) {
      summaryText += ` ${concern} exercises had slightly lower completion speed, presenting a gentle opportunity for shared practice or morning review.`;
    }
  } else {
    // Patient audience: warm, encouraging, dignified
    summaryText = `Wonderful work this week, ${name}! Your game performance in ${highlight} was especially bright and steady across all your sessions. With ${activeDays} active days and your morning routine going so well (${adherence}% completed), you are taking wonderful care of your mind.`;
    if (concern) {
      summaryText += ` When you feel like an extra gentle challenge, spending a quiet moment on ${concern} is a lovely way to keep exploring.`;
    }
  }

  return {
    summary: summaryText.trim(),
    highlightDimension: highlight,
    concernDimension: concern,
    source: 'fallback',
    audience,
    computedStats: stats,
    generatedAt: new Date().toISOString(),
  };
}
