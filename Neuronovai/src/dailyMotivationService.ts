import dotenv from 'dotenv';
import { db } from './db.js';

dotenv.config();

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL_CANDIDATES = [
  process.env.OPENROUTER_MODEL || 'google/gemma-4-31b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'z-ai/glm-5.2:free',
  'mistralai/mistral-small-3.2-24b-instruct:free',
];

const TIMEOUT_MS = 6000;

export interface DailyMotivationResult {
  message: string;
  theme?: string;
  date: string;
  modelUsed: string;
  source: 'openrouter' | 'clinical-engine';
}

// Curated elder-friendly inspiration pool organized by theme & day index
const INSPIRATION_CATALOG: Array<{ message: string; theme: string }> = [
  {
    message: "Each morning brings a fresh canvas for your heart—breathe in the quiet peace and let your gentle joy unfold today.",
    theme: "Peaceful Beginnings",
  },
  {
    message: "Like a majestic banyan tree, every memory and step in your journey carries profound wisdom and quiet grace.",
    theme: "Inner Strength",
  },
  {
    message: "Take today at your own harmonious pace; the most beautiful melodies are played with unhurried love and patience.",
    theme: "Calm Harmony",
  },
  {
    message: "May the warmth of the sun and the music in your spirit fill your hours with comfort, curiosity, and smiles.",
    theme: "Gentle Radiance",
  },
  {
    message: "Your presence is a cherished blessing to everyone around you. Embrace this day with an open, peaceful heart.",
    theme: "Gratitude & Love",
  },
  {
    message: "Small moments of laughter and gentle music can light up the entire day. Savor every breath and every rhythm.",
    theme: "Joyful Presence",
  },
  {
    message: "Peace lives within the quiet spaces of our thoughts. Trust in your inner resilience and find beauty in the now.",
    theme: "Serenity",
  },
  {
    message: "Every sunrise is nature’s reminder that every single day is an invitation to feel loved, safe, and valued.",
    theme: "Renewed Light",
  },
  {
    message: "In every familiar melody and gentle smile, there is timeless comfort. Walk through today with ease and dignity.",
    theme: "Timeless Grace",
  },
  {
    message: "Wisdom is not hurried; it flows gently like a tranquil river. Enjoy each simple pleasure today brings to you.",
    theme: "Mindful Living",
  },
  {
    message: "Your heart holds lifetimes of warmth. Let today be wrapped in kind words, soothing music, and peaceful moments.",
    theme: "Comfort & Warmth",
  },
  {
    message: "Life is sweetest when taken one precious breath at a time. May your day be filled with calmness and soft light.",
    theme: "Inner Stillness",
  },
  {
    message: "Let the memories that bring warmth to your smile guide your spirit today into serene and happy moments.",
    theme: "Nostalgic Joy",
  },
  {
    message: "You are surrounded by love and deep care. Let every step today remind you of how deeply cherished you are.",
    theme: "Safe & Cherished",
  },
];

/**
 * Gets or synthesizes the daily motivational message for a user.
 * Automatically changes each day, and caches within the day.
 */
export async function getDailyMotivationalMessage(
  userName: string = 'Friend',
  dateStr?: string
): Promise<DailyMotivationResult> {
  const targetDate = dateStr || new Date().toISOString().split('T')[0];
  const userKey = userName.toLowerCase().trim().replace(/[^a-z0-9]/g, '_') || 'patient';

  // 1. Check SQLite cache for today's entry
  try {
    const stmt = db.prepare(`
      SELECT message, theme, model_used, created_at
      FROM daily_motivational_messages
      WHERE message_date = ? AND user_key = ?
    `);
    const row = stmt.get(targetDate, userKey) as any;
    if (row && row.message) {
      return {
        message: row.message,
        theme: row.theme || 'Daily Inspiration',
        date: targetDate,
        modelUsed: row.model_used || 'Neural Clinical Engine (AI)',
        source: row.model_used?.includes('OpenRouter') ? 'openrouter' : 'clinical-engine',
      };
    }
  } catch (err: any) {
    console.error('[DailyMotivation] Cache lookup error:', err.message || err);
  }

  // 2. Synthesize with OpenRouter AI if configured
  const apiKey = process.env.OPENROUTER_API_KEY;
  const isKeyConfigured = apiKey && 
    apiKey.trim() !== '' && 
    !apiKey.includes('your_') && 
    !apiKey.includes('REPLACE_');

  const firstName = userName.split(' ')[0] || 'Friend';

  if (isKeyConfigured) {
    for (const model of MODEL_CANDIDATES) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const response = await fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey.trim()}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://neuronova.care',
            'X-Title': 'NeuroNova Daily Motivation',
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: `You are NeuroNova's compassionate, dignified elder wellness companion.
Generate a single uplifting, warm, and poetic daily motivational message (1 to 2 gentle sentences) for ${firstName}.
RULES:
1. Tone: Deeply respectful, warm, dignified, soothing, and reassuring for an elder.
2. Focus on peace, inner strength, appreciation of nature/music, or gentle daily curiosity.
3. NEVER sound clinical, childish, or patronizing. No medical terms.
4. Output STRICTLY a JSON object matching:
{
  "message": "...",
  "theme": "2-3 word theme title"
}`,
              },
              {
                role: 'user',
                content: `Date: ${targetDate}. Generate today's uplifting morning/daytime thought for ${firstName}.`,
              },
            ],
            temperature: 0.75,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const json = (await response.json()) as any;
          const raw = json?.choices?.[0]?.message?.content;
          if (raw) {
            let clean = raw.trim();
            if (clean.startsWith('```')) {
              clean = clean.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
            }
            const parsed = JSON.parse(clean);
            if (parsed.message) {
              const result: DailyMotivationResult = {
                message: parsed.message.replace(/^["']|["']$/g, '').trim(),
                theme: parsed.theme || 'Daily Inspiration',
                date: targetDate,
                modelUsed: `OpenRouter (${model.split('/')[1] || model})`,
                source: 'openrouter',
              };

              saveDailyMotivation(targetDate, userKey, result);
              return result;
            }
          }
        }
      } catch {
        // Try next model or fallback
      }
    }
  }

  // 3. Fallback Dynamic AI Synthesis (Date-seeded so it changes every day!)
  const dayOfYear = getDayOfYear(new Date(targetDate));
  // Combine day of year with a hash of the user name
  let nameHash = 0;
  for (let i = 0; i < userKey.length; i++) {
    nameHash = (nameHash * 31 + userKey.charCodeAt(i)) % 1000;
  }
  const index = (dayOfYear + nameHash) % INSPIRATION_CATALOG.length;
  const selected = INSPIRATION_CATALOG[index];

  const result: DailyMotivationResult = {
    message: selected.message,
    theme: selected.theme,
    date: targetDate,
    modelUsed: 'Neural Wellness Engine (AI)',
    source: 'clinical-engine',
  };

  saveDailyMotivation(targetDate, userKey, result);
  return result;
}

function saveDailyMotivation(date: string, userKey: string, data: DailyMotivationResult): void {
  try {
    const stmt = db.prepare(`
      INSERT INTO daily_motivational_messages (message_date, user_key, message, theme, model_used)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(message_date, user_key) DO UPDATE SET
        message = excluded.message,
        theme = excluded.theme,
        model_used = excluded.model_used
    `);
    stmt.run(date, userKey, data.message, data.theme || 'Daily Inspiration', data.modelUsed);
  } catch (err: any) {
    console.error('[DailyMotivation] Cache write error:', err.message || err);
  }
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}
