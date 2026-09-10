import dotenv from 'dotenv';
import { ComputedStats, ProgressSummaryResponse } from './types.js';
import { generateFallbackSummary } from './fallbackTemplates.js';
import { NEUROMUSIC_URL, NEUROGAMES_URL } from './config/urls.js';

dotenv.config();

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL_CANDIDATES = [
  process.env.OPENROUTER_MODEL || 'z-ai/glm-5.2:free',
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'minimax/minimax-m3:free',
  'liquid/lfm-2.5-2.6b:free',
];

const TIMEOUT_MS = 6000; // 6 second cutoff per model attempt


/**
 * Builds the strict system prompt enforcing non-clinical language and cognitive game framing.
 */
function buildSystemPrompt(audience: 'patient' | 'caregiver'): string {
  if (audience === 'caregiver') {
    return `You are NeuroNova's compassionate cognitive progress synthesizer assisting family caregivers.
CRITICAL RULES:
1. Frame all observations STRICTLY around "cognitive game performance" and daily routine participation.
2. ABSOLUTELY FORBIDDEN: Diagnostic claims, medical prognoses, or disease status words (e.g., NEVER say "dementia slowed", "Alzheimer's improved", "decline reversed", or "cognitive disease").
3. Always highlight positive trends first (e.g. "Memory game accuracy increased by 8% over the past week").
4. If an area shows lower performance, mention it gently as an opportunity for supportive engagement or morning practice, avoiding alarming or clinical terms.
5. Keep the narrative concise (3-4 sentences), clear, respectful, and actionable.
6. OUTPUT FORMAT: Respond ONLY with a valid JSON object matching:
{
  "summary": "3-4 sentence narrative",
  "highlightDimension": "name of top dimension",
  "concernDimension": "name of dimension with room for support, or null"
}`;
  }

  // Patient audience prompt:
  return `You are NeuroNova's warm, supportive companion for an elder user.
CRITICAL RULES:
1. Frame all notes STRICTLY around "game performance", "playful brain exercises", and gentle morning routines.
2. ABSOLUTELY FORBIDDEN: Medical claims, diagnostic status, disease names, or decline terminology.
3. Tone: Warm, dignified, uplifting, and patient.
4. Structure: Celebrate their positive progress first. If an area has room for practice, suggest it as a gentle, optional curiosity.
5. Keep the text between 3 and 4 sentences.
6. OUTPUT FORMAT: Respond ONLY with a valid JSON object matching:
{
  "summary": "3-4 sentence warm narrative",
  "highlightDimension": "name of top dimension",
  "concernDimension": "name of dimension for gentle practice, or null"
}`;
}

/**
 * Calls OpenRouter to synthesize a structured narrative summary.
 * If the API is missing an API key, times out, or fails, it cleanly delegates to fallbackTemplates.
 */
export async function generateNarrativeSummary(
  stats: ComputedStats,
  audience: 'patient' | 'caregiver' = 'patient'
): Promise<ProgressSummaryResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  // If no API key configured or placeholder present, immediately use fallback
  if (!apiKey || apiKey.includes('your_') || apiKey.trim() === '') {
    console.warn('[NeuroNova AI] OPENROUTER_API_KEY missing or unconfigured. Using deterministic fallback.');
    return generateFallbackSummary(stats, audience);
  }

  const systemPrompt = buildSystemPrompt(audience);
  const userPrompt = `Pre-computed weekly statistics for ${stats.patientName || 'the user'}:
- Best performing dimension: ${stats.highlightDimension}
- Dimension needing attention: ${stats.concernDimension || 'None'}
- Routine adherence: ${stats.routineAdherencePercent}%
- Active days: ${stats.activeDaysCount} out of ${stats.windowDays}
- Detailed breakdown:
${JSON.stringify(stats.dimensions, null, 2)}

Please generate the structured JSON summary.`;

  for (const model of MODEL_CANDIDATES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.replace(/[<>]/g, '').trim()}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://neuronova.care',
          'X-Title': 'NeuroNova Cognitive Companion',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          stream: false,
          temperature: 0.6,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[NeuroNova AI] Model ${model} returned HTTP ${response.status}:`, errorText);
        continue; // Try next model candidate
      }

      const data = (await response.json()) as any;
      const content = data?.choices?.[0]?.message?.content;

      if (!content) {
        console.warn(`[NeuroNova AI] Model ${model} returned empty content, trying next candidate.`);
        continue;
      }

      // Parse JSON from model output (handling possible markdown backticks ```json ... ```)
      let cleanedContent = content.trim();
      if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
      }

      try {
        const parsed = JSON.parse(cleanedContent);
        if (parsed.summary && typeof parsed.summary === 'string') {
          return {
            summary: parsed.summary,
            highlightDimension: parsed.highlightDimension || stats.highlightDimension,
            concernDimension: parsed.concernDimension !== undefined ? parsed.concernDimension : stats.concernDimension,
            source: 'llm',
            audience,
            computedStats: stats,
            generatedAt: new Date().toISOString(),
          };
        }
      } catch (parseError) {
        if (cleanedContent.length > 30) {
          return {
            summary: cleanedContent.replace(/"/g, ''),
            highlightDimension: stats.highlightDimension,
            concernDimension: stats.concernDimension,
            source: 'llm',
            audience,
            computedStats: stats,
            generatedAt: new Date().toISOString(),
          };
        }
      }
    } catch (err: any) {
      console.warn(`[NeuroNova AI] Error calling model ${model}:`, err.message || err);
      continue;
    }
  }

  console.log('[NeuroNova AI] All model candidates exhausted or rate-limited. Falling back to deterministic template.');
  return generateFallbackSummary(stats, audience);
}

// ============================================================================
// VOICE COMPANION CONVERSATIONAL AI PIPELINE
// ============================================================================

export interface VoiceCompanionContext {
  question: string;
  userName?: string;
  userId?: string;
  currentTime?: string;
  currentDate?: string;
  routine?: Array<{
    title: string;
    displayTime?: string;
    completed?: boolean;
    category?: string;
    friendlyPrompt?: string;
  }>;
  recentGames?: Array<{ gameType: string; score?: number; accuracy?: number }>;
  recentMusic?: Array<{ title: string; artist?: string }>;
  isHindi?: boolean;
  weather?: {
    cityName: string;
    tempC: number;
    tempF: number;
    condition: string;
    description: string;
    elderAdviceEn: string;
    elderAdviceHi: string;
  };
}

export interface VoiceCompanionResponse {
  reply: string;
  displayReply?: string;
  spokenReply?: string;
  translatedQuestion?: string;
  source: 'llm' | 'fallback';
  intent?: string;
  autoRedirect?: boolean;
  suggestedAction?: {
    label: string;
    url: string;
    icon: 'music' | 'game';
  } | null;
}

/**
 * Generates an empathetic, patient-centered voice companion response using GLM 5.2 / candidate models on OpenRouter.
 * Grounds answers in real patient context (routine, games, music) with deterministic fallback.
 */
export async function generateVoiceCompanionResponse(
  context: VoiceCompanionContext
): Promise<VoiceCompanionResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const userName = context.userName || 'Friend';
  const q = (context.question || '').trim();

  // 1. Build deterministic context-aware fallback
  const createFallbackReply = (): VoiceCompanionResponse => {
    const qLower = q.toLowerCase();
    const pendingTasks = (context.routine || []).filter((r) => !r.completed);

    const isHindi = Boolean(context.isHindi);

    if (qLower.includes('suggest') || qLower.includes('what should') || qLower.includes('bored') || qLower.includes('what now') || qLower.includes('kya karu') || qLower.includes('kya karna')) {
      if (pendingTasks.length > 0) {
        const nextTask = pendingTasks[0];
        const en = `How about preparing for your upcoming activity: "${nextTask.title}" at ${nextTask.displayTime || 'soon'}? Take your time, there is no hurry.`;
        const hi = `आप अपनी अगली गतिविधि की तैयारी कर सकते हैं: "${nextTask.title}" (${nextTask.displayTime || 'जल्द ही'})। आराम से कीजिए।`;
        return {
          reply: en,
          spokenReply: isHindi ? hi : en,
          source: 'fallback',
          suggestedAction: null,
        };
      }
      const en = `You have completed all scheduled activities for today, ${userName}! It is a wonderful time to sit back and rest peacefully.`;
      const hi = `आज के लिए आपकी सभी गतिविधियां पूरी हो चुकी हैं, ${userName}! अब आप आराम कर सकते हैं।`;
      return {
        reply: en,
        spokenReply: isHindi ? hi : en,
        source: 'fallback',
        suggestedAction: null,
      };
    }

    if (context.weather && (qLower.includes('weather') || qLower.includes('temperature') || qLower.includes('mausam') || qLower.includes('barish') || qLower.includes('rain') || qLower.includes('cold') || qLower.includes('hot') || qLower.includes('outside'))) {
      const w = context.weather;
      const en = `In ${w.cityName}, it is currently ${w.description} with a temperature of ${w.tempC}°C (${w.tempF}°F). ${w.elderAdviceEn}`;
      const hi = `${w.cityName} में आज का मौसम ${w.description} है और तापमान ${w.tempC}°C है। ${w.elderAdviceHi}`;
      return {
        reply: en,
        displayReply: en,
        spokenReply: isHindi ? hi : en,
        source: 'fallback',
        suggestedAction: null,
      };
    }

    if (qLower.includes('music') || qLower.includes('song') || qLower.includes('gaana') || qLower.includes('sangeet')) {
      const en = `Opening peaceful morning melodies for you now, ${userName}. Settle back and let the calming music ease your mind.`;
      const hi = `आपके लिए मधुर और शांत संगीत शुरू कर रहे हैं, ${userName}। आराम से बैठिए और संगीत का आनंद लीजिए।`;
      return {
        reply: en,
        spokenReply: isHindi ? hi : en,
        source: 'fallback',
        suggestedAction: {
          label: 'Open Neuromusic',
          url: `${NEUROMUSIC_URL}/`,
          icon: 'music',
        },
      };
    }

    if (qLower.includes('game') || qLower.includes('play') || qLower.includes('puzzle') || qLower.includes('khel')) {
      const en = `Playing gentle brain games keeps your mind vibrant and happy, ${userName}! Would you like to try a round of Memory Match?`;
      const hi = `हल्के-फुल्के दिमागी खेल आपके मन को चुस्त और खुश रखते हैं, ${userName}! क्या आप मेमोरी मैच खेलना चाहेंगे?`;
      return {
        reply: en,
        spokenReply: isHindi ? hi : en,
        source: 'fallback',
        suggestedAction: {
          label: 'Play Neurogames',
          url: `${NEUROGAMES_URL}/`,
          icon: 'game',
        },
      };
    }

    if (pendingTasks.length > 0) {
      const nextTask = pendingTasks[0];
      const en = `I am right here with you, ${userName}! Your next scheduled activity is "${nextTask.title}" at ${nextTask.displayTime || 'soon'}. There is no rush at all.`;
      const hi = `मैं हमेशा आपके साथ हूँ, ${userName}! आपका अगला निर्धारित कार्य "${nextTask.title}" (${nextTask.displayTime || 'जल्द ही'}) है। कोई जल्दी नहीं है।`;
      return {
        reply: en,
        spokenReply: isHindi ? hi : en,
        source: 'fallback',
      };
    }

    const en = `I am right here beside you, ${userName}. You are doing wonderful today, and everything is calm and safe. How can I help make your day peaceful?`;
    const hi = `मैं हमेशा आपके साथ हूँ, ${userName}। आप आज बहुत अच्छा कर रहे हैं, सब कुछ शांत और सुरक्षित है। मैं आपके दिन को और सुखद बनाने में क्या मदद करूँ?`;
    return {
      reply: en,
      spokenReply: isHindi ? hi : en,
      source: 'fallback',
    };
  };

  // If no API key configured or placeholder present, immediately use fallback
  if (!apiKey || apiKey.includes('your_') || apiKey.trim() === '') {
    console.warn('[NeuroNova Voice Companion] OPENROUTER_API_KEY missing. Using contextual deterministic fallback.');
    return createFallbackReply();
  }

  // Format context for prompt
  const pending = (context.routine || []).filter((r) => !r.completed);
  const routineSummary = pending.length > 0
    ? pending.map((r) => `- ${r.displayTime || 'Upcoming'}: ${r.title} (${r.category || 'general'})`).join('\n')
    : 'All scheduled routine items for today are completed!';

  const gamesSummary = (context.recentGames && context.recentGames.length > 0)
    ? context.recentGames.map((g) => `- ${g.gameType}${g.score ? ` (score: ${g.score})` : ''}`).join('\n')
    : 'No cognitive games played yet today. (Available in Neurogames: Memory Match, Pattern Sequence, Word Association).';

  const musicContext = (context.recentMusic && context.recentMusic.length > 0)
    ? `User has ${context.recentMusic.length} liked songs saved (e.g. ${context.recentMusic.slice(0, 2).map((m) => m.title).join(', ')}). IMPORTANT: You do NOT know which specific song is playing or will play next — do NOT name a specific track in your response.`
    : 'Peaceful music is available in Neuromusic. You do NOT know which specific song will play — do NOT name any specific track in your response.';

  const isHindi = Boolean(context.isHindi);
  const languageInstruction = isHindi
    ? `7. CRITICAL MULTILINGUAL REQUIREMENT: The user is speaking in Hindi.
- "displayReply": Exactly 2 to 3 short sentences in CLEAR, WARM ENGLISH for screen display. NEVER use Hindi or Devanagari in displayReply!
- "spokenReply": Exactly 2 to 3 short sentences in WARM, CONVERSATIONAL HINDI (using Devanagari script) for voice audio output.
- "translatedQuestion": English translation of what the user asked.
Maintain an affectionate, respectful, and dignified tone appropriate for an elder.`
    : `7. Language: Speak in clear, warm English for both display and voice.`;

  const systemPrompt = `You are NeuroNova's Voice Companion, a compassionate, warm, and gentle AI assistant speaking directly to an elder user (${userName}).
CRITICAL RULES:
1. Tone: Warm, dignified, uplifting, calm, and reassuring. Speak gently and conversationally, as if speaking to a beloved elder.
2. Brevity: Exactly 2 to 3 short sentences. This response will be read aloud via Text-to-Speech, so keep it clear, simple, and easy to hear without complex grammar.
3. Relevant & Grounded: When the user asks for suggestions, suggest specific real activities from their remaining routine, or recommend Neurogames or Neuromusic.
4. STRICTLY FORBIDDEN — Clinical terms: NEVER say "dementia", "Alzheimer's", "decline", "patient", "impairment", or "disease".
5. STRICTLY FORBIDDEN — Hallucinated facts: NEVER name a specific song title, score, or time unless it was explicitly provided to you in the context below as a confirmed real fact. If you do not have a confirmed fact, stay general (e.g. say "some peaceful music" not "the song 'Shady'"). Violating this rule is the most serious possible error.
6. OUTPUT FORMAT: Respond ONLY with a valid JSON object matching:
{
  "displayReply": "Your 2-3 sentence warm English response for screen display.",
  "spokenReply": "Your 2-3 sentence spoken response (${isHindi ? 'in Hindi using Devanagari script' : 'in English'}).",
  "translatedQuestion": "English translation of what user asked",
  "suggestedApp": "music" | "game" | null
}
${languageInstruction}`;

  const userPrompt = `Context for ${userName}:
- Spoken Language: ${isHindi ? 'Hindi' : 'English'}
- Current Time: ${context.currentTime || 'Morning'}
- Current Date: ${context.currentDate || 'Today'}
- Remaining Routine Schedule:
${routineSummary}
- Recent Game Activity:
${gamesSummary}
- Music Context (READ CAREFULLY):
${musicContext}
- Patient's Current Local Weather (from OpenWeather API):
${context.weather ? `In ${context.weather.cityName}, currently ${context.weather.description} at ${context.weather.tempC}°C (${context.weather.tempF}°F). Elder comfort advice: ${context.weather.elderAdviceEn}` : 'Local weather data currently unavailable.'}

User asked: "${q}"

Respond with the JSON object.${isHindi ? ' Remember: displayReply MUST be English, spokenReply MUST be Hindi.' : ''}`;

  for (const model of MODEL_CANDIDATES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.replace(/[<>]/g, '').trim()}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://neuronova.care',
          'X-Title': 'NeuroNova Voice Companion',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          stream: false,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[Voice Companion AI] Model ${model} returned HTTP ${response.status}:`, errorText);
        continue;
      }

      const data = (await response.json()) as any;
      const content = data?.choices?.[0]?.message?.content;
      if (!content) continue;

      let cleanedContent = content.trim();
      if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
      }

      try {
        const parsed = JSON.parse(cleanedContent);
        const englishDisplay = parsed.displayReply || (!/[\u0900-\u097F]/.test(parsed.reply || '') ? parsed.reply : null) ||
          `I am right here beside you, ${userName}. Everything is calm and well.`;
        const spokenText = parsed.spokenReply || parsed.reply || englishDisplay;

        let action: { label: string; url: string; icon: 'music' | 'game' } | null = null;
        const qLower = q.toLowerCase();
        const translatedLower = (parsed.translatedQuestion || '').toLowerCase();
        const askedForMusic =
          parsed.suggestedApp === 'music' ||
          /\b(play|music|song|songs|track|tracks|gaana|gana|geet|sangeet|bhajan|bhajans|aarti|arti|kirtan|dhun|bajao|chalao|lagao|sunao|sunna)\b/i.test(qLower) ||
          /\b(play|music|song|songs|track|listen to|bhajan|aarti|melody|tune)\b/i.test(translatedLower);

        const askedForGame =
          parsed.suggestedApp === 'games' ||
          parsed.suggestedApp === 'game' ||
          /\b(game|games|puzzle|khel|khelna)\b/i.test(qLower) ||
          /\b(game|games|puzzle)\b/i.test(translatedLower);

        if (askedForMusic) {
          // Extract specific song/bhajan name from translated question or raw input, stripping parentheticals
          let songCandidate = '';
          const sourceText = parsed.translatedQuestion || q;
          const cleanedText = sourceText.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();
          const matchSong = cleanedText.match(/^(?:please\s+)?(?:can\s+you\s+|could\s+you\s+)?(?:play|put\s+on|listen\s+to|start)\s+(?:song\s+|track\s+|bhajan\s+|aarti\s+)?(.+)$/i);
          if (matchSong && matchSong[1]) {
            songCandidate = matchSong[1].replace(/\s+(?:song|songs|track|music|bhajan)$/i, '').trim();
          }
          if (!songCandidate) {
            const trimmedClean = cleanedText.replace(/\b(play|song|music|gaana|sunao|bajao)\b/gi, '').trim();
            if (trimmedClean.length > 2) {
              songCandidate = trimmedClean;
            }
          }

          action = {
            label: songCandidate ? `Play: ${songCandidate}` : 'Open Neuromusic',
            url: songCandidate
              ? `${NEUROMUSIC_URL}/?play=${encodeURIComponent(songCandidate)}`
              : `${NEUROMUSIC_URL}/`,
            icon: 'music'
          };
        } else if (askedForGame) {
          action = { label: 'Play Neurogames', url: `${NEUROGAMES_URL}/`, icon: 'game' };
        }

        return {
          reply: englishDisplay,
          displayReply: englishDisplay,
          spokenReply: spokenText,
          translatedQuestion: parsed.translatedQuestion,
          source: 'llm',
          intent: askedForMusic ? 'play_specific_song' : (askedForGame ? 'game_inquiry' : 'open_ended'),
          autoRedirect: askedForMusic || askedForGame,
          suggestedAction: action,
        };
      } catch (_) {
        if (cleanedContent.length > 20 && !cleanedContent.startsWith('{')) {
          const isDevanagari = /[\u0900-\u097F]/.test(cleanedContent);
          const englishDisplay = isDevanagari
            ? `I am right here beside you, ${userName}. How can I assist you today?`
            : cleanedContent.replace(/["{}]/g, '').trim();
          return {
            reply: englishDisplay,
            displayReply: englishDisplay,
            spokenReply: cleanedContent.replace(/["{}]/g, '').trim(),
            source: 'llm',
          };
        }
      }
    } catch (err: any) {
      console.warn(`[Voice Companion AI] Error calling model ${model}:`, err.message || err);
      continue;
    }
  }

  console.log('[Voice Companion AI] Models exhausted or timed out. Using deterministic context fallback.');
  return createFallbackReply();
}
