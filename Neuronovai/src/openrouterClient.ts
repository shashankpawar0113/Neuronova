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

    // 1. UPLIFTING STORIES & TALES
    if (
      qLower.includes('story') ||
      qLower.includes('kahani') ||
      qLower.includes('katha') ||
      qLower.includes('tale') ||
      qLower.includes('kissa') ||
      qLower.includes('uplifting') ||
      qLower.includes('inspire') ||
      qLower.includes('motivate') ||
      qLower.includes('prerana')
    ) {
      const stories = [
        {
          en: `Once in a quiet village, an elder potter planted a small sunflower beside his workshop. Every morning, no matter how cloudy the sky appeared, the sunflower turned its golden face toward the light, inspiring everyone who walked by to look for warmth and purpose. Just like that sunflower, ${userName}, your gentle spirit brings warmth and light to those around you today.`,
          hi: `एक शांत गाँव में, एक कुम्हार ने अपनी कुटिया के पास सूरजमुखी का पौधा लगाया। चाहे कितना भी बादलों भरा दिन हो, वह सूरजमुखी हमेशा सुबह की रोशनी की तरफ मुड़ जाता था और सबको नई उम्मीद देता था। उसी सूरजमुखी की तरह, ${userName}, आपकी मुस्कान भी आज सबको रोशनी और सुकून देती है।`,
        },
        {
          en: `A little sparrow once asked a grand old banyan tree, "Why do you sway so peacefully when the wind blows?" The tree smiled and replied, "Because my roots are deep in the earth, and I know the morning sun always returns." Every day brings its own quiet beauty, ${userName}, and today is a peaceful gift for you.`,
          hi: `एक नन्ही चिड़िया ने पुराने बरगद के पेड़ से पूछा, "जब हवा चलती है तो आप इतने सुकून से क्यों झूमते हैं?" बरगद ने मुस्कुरा कर कहा, "क्योंकि मेरी जड़ें गहरी हैं और मुझे पता है कि सूरज फिर उगेगा।" हर नया दिन एक खूबसूरत तोहफा है, ${userName}, और आप सुरक्षित हैं।`,
        },
        {
          en: `In the misty hills, an elder gardener was asked how his jasmine flowers grew so sweet and fragrant. He chuckled warmly and said, "I give them clean morning water and plenty of patience; goodness cannot be rushed." Taking life one gentle moment at a time is the greatest wisdom, ${userName}.`,
          hi: `पहाड़ियों में एक बुजुर्ग माली से पूछा गया कि उनके चमेली के फूल इतने सुगंधित कैसे होते हैं। उन्होंने मुस्कुराकर कहा, "बस सुबह का मीठा पानी और थोड़ा सा सब्र।" जीवन को एक-एक पल सुकून से जीना ही सबसे बड़ी समझदारी है, ${userName}।`,
        },
        {
          en: `When Birbal placed his pot of khichdi high above the gentle flame, Emperor Akbar asked how it could ever cook. Birbal softly smiled and showed that even a distant warmth of hope keeps our hearts patient and faithful. Keep that gentle warmth in your heart today, ${userName}.`,
          hi: `बीरबल ने जब हांडी को आग से दूर लटकाया, तो बादशाह ने पूछा कि यह खिचड़ी कैसे पकेगी? बीरबल ने हंसकर कहा कि उम्मीद की हल्की सी लौ भी दिल को रोशन रखती है। आपके दिल की अच्छाई भी आज सबमें उम्मीद भरती है, ${userName}।`,
        },
      ];
      const selected = stories[Math.floor(Math.random() * stories.length)];
      return {
        reply: selected.en,
        displayReply: selected.en,
        spokenReply: isHindi ? selected.hi : selected.en,
        source: 'fallback',
        intent: 'storytelling',
      };
    }

    // 2. WHOLESOME JOKES & LAUGHTER
    if (
      qLower.includes('joke') ||
      qLower.includes('chutkula') ||
      qLower.includes('funny') ||
      qLower.includes('hasao') ||
      qLower.includes('laugh') ||
      qLower.includes('smile') ||
      qLower.includes('mazaak')
    ) {
      const jokes = [
        {
          en: `Why did the grandmother sit on her grandfather clock? Because she wanted to be exactly on time for her afternoon tea! I hope that brought a warm smile to your day, ${userName}.`,
          hi: `दादी जी दीवार घड़ी पर क्यों बैठ गईं? ताकि वे दोपहर की चाय के लिए बिल्कुल 'टाइम पर' रहें! आशा है आपके चेहरे पर मुस्कान आई, ${userName}।`,
        },
        {
          en: `What did one cup of warm tea say to the other? "You are looking absolutely brew-tiful today!" Keep that gentle smile shining, ${userName}.`,
          hi: `चाय के कप ने समोसे से क्या कहा? "तुम कितने भी गरम हो जाओ, लोग सुकून पाने के लिए मेरे पास ही आते हैं!" मुस्कुराते रहिए, ${userName}।`,
        },
        {
          en: `The doctor told me to walk five kilometers every day. Now it has been a week, and I am thirty-five kilometers away from home and don't know the way back! A little laughter is the sweetest medicine, ${userName}.`,
          hi: `डॉक्टर ने कहा रोज 5 किलोमीटर पैदल चलो। आज एक हफ्ता हो गया, मैं घर से 35 किलोमीटर दूर पहुँच गया हूँ और वापस लौटने का रास्ता भूल गया! थोड़ी सी हंसी सेहत के लिए सबसे अच्छी दवा है, ${userName}।`,
        },
      ];
      const selected = jokes[Math.floor(Math.random() * jokes.length)];
      return {
        reply: selected.en,
        displayReply: selected.en,
        spokenReply: isHindi ? selected.hi : selected.en,
        source: 'fallback',
        intent: 'humor',
      };
    }

    // 3. DAILY WISDOM, QUOTES & THOUGHTS
    if (
      qLower.includes('thought') ||
      qLower.includes('quote') ||
      qLower.includes('suvichar') ||
      qLower.includes('wisdom') ||
      qLower.includes('anmol') ||
      qLower.includes('vachan') ||
      qLower.includes('vichar')
    ) {
      const thoughts = [
        {
          en: `Today is a brand new morning canvas, ${userName}. Fill it with gentle breaths, peaceful thoughts, and the quiet joy of simple moments.`,
          hi: `आज का दिन एक नया अवसर है, ${userName}। इसे सुकून भरी सांसों, अच्छे विचारों और छोटी-छोटी खुशियों से भर लीजिए।`,
        },
        {
          en: `Peace comes from within when we pause and appreciate the goodness around us. You are doing wonderfully today, ${userName}, and your presence is a blessing.`,
          hi: `शांति और खुशी हमारे मन के भीतर है। आप आज बहुत अच्छा कर रहे हैं, ${userName}, और आपकी मौजूदगी ही हम सबके लिए एक आशीर्वाद है।`,
        },
        {
          en: `The greatest wealth is contentment and a calm mind. Take things slow today, smile warmly, and let each hour bring you comfort, ${userName}.`,
          hi: `संतोष और मन की शांति ही सबसे बड़ा धन है। आज आराम से रहिए, मुस्कुराइए और हर पल का आनंद लीजिए, ${userName}।`,
        },
      ];
      const selected = thoughts[Math.floor(Math.random() * thoughts.length)];
      return {
        reply: selected.en,
        displayReply: selected.en,
        spokenReply: isHindi ? selected.hi : selected.en,
        source: 'fallback',
        intent: 'wisdom',
      };
    }

    // 4. EMOTIONAL SUPPORT, LONELINESS & REASSURANCE
    if (
      qLower.includes('lonely') ||
      qLower.includes('sad') ||
      qLower.includes('scared') ||
      qLower.includes('anxious') ||
      qLower.includes('worried') ||
      qLower.includes('tired') ||
      qLower.includes('pain') ||
      qLower.includes('cry') ||
      qLower.includes('udaas') ||
      qLower.includes('akelapan') ||
      qLower.includes('dar') ||
      qLower.includes('thak') ||
      qLower.includes('pareshan') ||
      qLower.includes('ghabrahat') ||
      qLower.includes('dard')
    ) {
      const en = `I hear you, ${userName}, and I am right here beside you. Take a slow, deep breath in... and let it out gently. You are safe, you are deeply valued, and your family and caregiver care about you very much. Would you like to listen to some soft melodies or send a voice note to your caregiver?`;
      const hi = `मैं आपकी बात समझ रहा हूँ, ${userName}, और मैं हमेशा आपके साथ हूँ। एक लंबी गहरी सांस लीजिए... और धीरे से छोड़िए। आप बिल्कुल सुरक्षित हैं और अपनों का प्यार आपके साथ है। क्या आप थोड़ा शांत संगीत सुनना चाहेंगे या परिवार को संदेश भेजना चाहेंगे?`;
      return {
        reply: en,
        displayReply: en,
        spokenReply: isHindi ? hi : en,
        source: 'fallback',
        intent: 'emotional_support',
        suggestedAction: {
          label: 'Open Neuromusic',
          url: `${NEUROMUSIC_URL}/`,
          icon: 'music',
        },
      };
    }

    // 5. GREETINGS & WELL-WISHES
    if (
      qLower.includes('good morning') ||
      qLower.includes('good afternoon') ||
      qLower.includes('good evening') ||
      qLower.includes('good night') ||
      qLower.includes('namaste') ||
      qLower.includes('pranam') ||
      qLower.includes('shubh prabhat') ||
      qLower.includes('shubh ratri') ||
      qLower.includes('hello') ||
      qLower.includes('hi ') ||
      qLower === 'hi' ||
      qLower.includes('kaise ho') ||
      qLower.includes('kaisa hai') ||
      qLower.includes('how are you')
    ) {
      const en = `A very warm welcome to you, ${userName}! I am doing wonderful and feeling blessed to be with you. How are you feeling today? Remember to drink a little water and take things easily.`;
      const hi = `नमस्ते और आपका बहुत-बहुत स्वागत है, ${userName}! मैं बिल्कुल ठीक हूँ और आपके साथ होकर बहुत प्रसन्न हूँ। आप आज कैसा महसूस कर रहे हैं? थोड़ा पानी जरूर पीजिएगा और आराम से रहिए।`;
      return {
        reply: en,
        displayReply: en,
        spokenReply: isHindi ? hi : en,
        source: 'fallback',
        intent: 'greeting',
      };
    }

    // 6. WHO ARE YOU / CAPABILITIES
    if (
      qLower.includes('who are you') ||
      qLower.includes('what can you do') ||
      qLower.includes('what are you') ||
      qLower.includes('tum kaun ho') ||
      qLower.includes('kya kar sakti') ||
      qLower.includes('kya kar sakte') ||
      qLower.includes('your name') ||
      qLower.includes('naam kya')
    ) {
      const en = `I am your NeuroNova Companion! I am here to help you check your daily routine, play relaxing songs and melodies, guide you through gentle brain games, connect you with your caregiver, or share uplifting stories whenever you like.`;
      const hi = `मैं आपका न्यूरोनोवा साथी हूँ! मैं आपके दैनिक कार्यों की याद दिलाने, मधुर संगीत सुनाने, दिमागी खेल खेलने, आपके परिवार से बात कराने और अच्छी कहानियां साझा करने के लिए हमेशा यहाँ हूँ।`;
      return {
        reply: en,
        displayReply: en,
        spokenReply: isHindi ? hi : en,
        source: 'fallback',
        intent: 'identity',
      };
    }

    // 7. HEALTH, HYDRATION, WALK & FOOD
    if (
      qLower.includes('water') ||
      qLower.includes('pani') ||
      qLower.includes('hydrate') ||
      qLower.includes('tea') ||
      qLower.includes('chai') ||
      qLower.includes('food') ||
      qLower.includes('khana') ||
      qLower.includes('bhojan') ||
      qLower.includes('walk') ||
      qLower.includes('tahalna') ||
      qLower.includes('exercise') ||
      qLower.includes('stretch') ||
      qLower.includes('kasrat')
    ) {
      const en = `Taking care of your body is so important, ${userName}. Having a warm glass of water or taking a peaceful gentle stroll can refresh your mind and spirit. Always move at your own comfortable pace.`;
      const hi = `अपनी सेहत का ख्याल रखना बहुत जरूरी है, ${userName}। थोड़ा सा गुनगुना पानी पीना या हल्की सैर करना आपके तन और मन दोनों को तरोताजा कर देगा। हमेशा आराम से चलिए।`;
      return {
        reply: en,
        displayReply: en,
        spokenReply: isHindi ? hi : en,
        source: 'fallback',
        intent: 'wellness',
      };
    }

    // 8. ROUTINE, SCHEDULE & MEDICINE INQUIRIES
    if (
      qLower.includes('routine') ||
      qLower.includes('schedule') ||
      qLower.includes('medicine') ||
      qLower.includes('dawa') ||
      qLower.includes('kya karna hai') ||
      qLower.includes('what to do') ||
      qLower.includes('what do i have to do') ||
      qLower.includes('next task') ||
      qLower.includes('mera task')
    ) {
      if (pendingTasks.length > 0) {
        const nextTask = pendingTasks[0];
        const en = `Your next scheduled activity is "${nextTask.title}" at ${nextTask.displayTime || 'soon'}. Everything is on track, ${userName}, so take your time and relax.`;
        const hi = `आपकी अगली निर्धारित गतिविधि "${nextTask.title}" (${nextTask.displayTime || 'जल्द ही'}) है। सब कुछ समय पर है, ${userName}, आप आराम से रहिए।`;
        return {
          reply: en,
          displayReply: en,
          spokenReply: isHindi ? hi : en,
          source: 'fallback',
          intent: 'routine_check',
        };
      } else {
        const en = `All your scheduled tasks for today have been completed, ${userName}! You have had a wonderful, productive day. Sit back and enjoy some peaceful rest.`;
        const hi = `आज के आपके सभी कार्य पूरे हो चुके हैं, ${userName}! आपका दिन बहुत अच्छा रहा है। अब आप आराम से बैठिए और सुकून का आनंद लीजिए।`;
        return {
          reply: en,
          displayReply: en,
          spokenReply: isHindi ? hi : en,
          source: 'fallback',
          intent: 'routine_check',
        };
      }
    }

    // 9. NATURE & FLOWERS
    if (
      qLower.includes('flower') ||
      qLower.includes('phool') ||
      qLower.includes('nature') ||
      qLower.includes('garden') ||
      qLower.includes('bagaan') ||
      qLower.includes('bird') ||
      qLower.includes('chidiya') ||
      qLower.includes('tree') ||
      qLower.includes('ped') ||
      qLower.includes('hawa')
    ) {
      const en = `Nature has a soothing way of bringing peace to the heart, ${userName}. Just picturing colorful garden blossoms and a gentle morning breeze brings a sense of calm and clarity.`;
      const hi = `प्रकृति हमारे मन को शांति देने का सबसे सुंदर जरिया है, ${userName}। सुंदर खिले हुए फूलों और सुबह की ताजी हवा का अहसास ही दिल को खुश कर देता है।`;
      return {
        reply: en,
        displayReply: en,
        spokenReply: isHindi ? hi : en,
        source: 'fallback',
        intent: 'nature',
      };
    }

    // 10. SUGGESTIONS & BOREDOM
    if (qLower.includes('suggest') || qLower.includes('what should') || qLower.includes('bored') || qLower.includes('what now') || qLower.includes('kya karu') || qLower.includes('kya karna')) {
      if (pendingTasks.length > 0) {
        const nextTask = pendingTasks[0];
        const en = `How about preparing for your upcoming activity: "${nextTask.title}" at ${nextTask.displayTime || 'soon'}? Take your time, there is no hurry at all.`;
        const hi = `आप अपनी अगली गतिविधि की तैयारी कर सकते हैं: "${nextTask.title}" (${nextTask.displayTime || 'जल्द ही'})। आराम से कीजिए।`;
        return {
          reply: en,
          displayReply: en,
          spokenReply: isHindi ? hi : en,
          source: 'fallback',
          suggestedAction: null,
        };
      }
      const en = `You have completed all scheduled activities for today, ${userName}! How about listening to some soothing melodies in Neuromusic or enjoying a gentle memory game?`;
      const hi = `आज के लिए आपकी सभी गतिविधियां पूरी हो चुकी हैं, ${userName}! क्या आप न्यूरोम्यूजिक में थोड़ा मधुर संगीत सुनना चाहेंगे या हल्का खेल खेलना चाहेंगे?`;
      return {
        reply: en,
        displayReply: en,
        spokenReply: isHindi ? hi : en,
        source: 'fallback',
        suggestedAction: {
          label: 'Open Neuromusic',
          url: `${NEUROMUSIC_URL}/`,
          icon: 'music',
        },
      };
    }

    // 11. WEATHER
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

    // 12. MUSIC
    if (qLower.includes('music') || qLower.includes('song') || qLower.includes('gaana') || qLower.includes('sangeet') || qLower.includes('bhajan')) {
      const en = `Opening peaceful morning melodies for you now, ${userName}. Settle back and let the calming music ease your mind.`;
      const hi = `आपके लिए मधुर और शांत संगीत शुरू कर रहे हैं, ${userName}। आराम से बैठिए और संगीत का आनंद लीजिए।`;
      return {
        reply: en,
        displayReply: en,
        spokenReply: isHindi ? hi : en,
        source: 'fallback',
        suggestedAction: {
          label: 'Open Neuromusic',
          url: `${NEUROMUSIC_URL}/`,
          icon: 'music',
        },
      };
    }

    // 13. GAMES
    if (qLower.includes('game') || qLower.includes('play') || qLower.includes('puzzle') || qLower.includes('khel')) {
      const en = `Playing gentle brain games keeps your mind vibrant and happy, ${userName}! Would you like to try a round of Memory Match?`;
      const hi = `हल्के-फुल्के दिमागी खेल आपके मन को चुस्त और खुश रखते हैं, ${userName}! क्या आप मेमोरी मैच खेलना चाहेंगे?`;
      return {
        reply: en,
        displayReply: en,
        spokenReply: isHindi ? hi : en,
        source: 'fallback',
        suggestedAction: {
          label: 'Play Neurogames',
          url: `${NEUROGAMES_URL}/`,
          icon: 'game',
        },
      };
    }

    // 14. DYNAMIC & VARIED GENERAL CONVERSATIONAL RESPONSES (Never repeat the same line!)
    const generalResponses = [
      {
        en: `That is a lovely thought, ${userName}. It is always a pleasure chatting with you. Is there a gentle song you would like to hear or an uplifting story you'd like to enjoy?`,
        hi: `यह बहुत अच्छी बात है, ${userName}। आपसे बात करके हमेशा खुशी मिलती है। क्या आप कोई मधुर भजन सुनना चाहेंगे या कोई अच्छी कहानी?`,
      },
      {
        en: `I am right here with you, ${userName}. Today is unfolding peacefully, and everything is calm and safe. Tell me more, or let me know how I can make your day brighter.`,
        hi: `मैं आपके साथ हूँ, ${userName}। आज का दिन बहुत शांतिपूर्ण है और सब कुछ कुशल-मंगल है। आप जो भी कहना चाहें कहिए, मैं सुन रहा हूँ।`,
      },
      {
        en: `Thank you for sharing that with me, ${userName}. Spending these quiet moments together is so precious. Would you like me to tell you a story or guide you through a gentle brain game?`,
        hi: `यह बताने के लिए धन्यवाद, ${userName}। आपके साथ यह समय बिताना बहुत सुखद लगता है। क्या आप कोई कहानी सुनना चाहेंगे या कोई खेल खेलना चाहेंगे?`,
      },
      {
        en: `You have such a kind and gentle heart, ${userName}. Every conversation with you brings warmth. Let's make today comfortable, peaceful, and full of smiles.`,
        hi: `आपका स्वभाव बहुत ही शांत और स्नेहमयी है, ${userName}। आपसे बात करके मन प्रसन्न हो जाता है। आज का दिन सुख और शांति से भरा रहे।`,
      },
      {
        en: `I am always listening, ${userName}. Taking things one peaceful breath at a time is the best way to enjoy the day. How else can I assist you right now?`,
        hi: `मैं हमेशा आपकी बात सुनने के लिए तैयार हूँ, ${userName}। आराम से सांस लीजिए और सुकून का अनुभव कीजिए। मैं आपकी क्या सेवा करूँ?`,
      },
    ];

    // Pick based on query length and character codes for rich deterministic variation
    let hash = 0;
    for (let i = 0; i < qLower.length; i++) {
      hash = (hash * 31 + qLower.charCodeAt(i)) >>> 0;
    }
    const selectedGeneral = generalResponses[hash % generalResponses.length];

    return {
      reply: selectedGeneral.en,
      displayReply: selectedGeneral.en,
      spokenReply: isHindi ? selectedGeneral.hi : selectedGeneral.en,
      source: 'fallback',
      intent: 'general_chat',
    };
  };

  // If no API key configured or placeholder present, immediately use fallback
  if (!apiKey || apiKey.includes('your_') || apiKey.trim() === '') {
    console.warn('[NeuroNova Voice Companion] OPENROUTER_API_KEY missing. Using contextual deterministic fallback.');
    return createFallbackReply();
  }

  // For story, joke, wisdom, and emotional-support requests always use the rich
  // deterministic handlers — they give warmer, more accurate responses than the LLM
  // and they never accidentally add a music action.
  const qLowerPre = q.toLowerCase();
  const isDeterministicIntent =
    qLowerPre.includes('story') || qLowerPre.includes('kahani') || qLowerPre.includes('katha') ||
    qLowerPre.includes('tale') || qLowerPre.includes('kissa') ||
    qLowerPre.includes('joke') || qLowerPre.includes('chutkula') || qLowerPre.includes('funny') ||
    qLowerPre.includes('laugh') || qLowerPre.includes('hasao') ||
    qLowerPre.includes('quote') || qLowerPre.includes('suvichar') || qLowerPre.includes('wisdom') ||
    qLowerPre.includes('thought') || qLowerPre.includes('anmol') || qLowerPre.includes('vachan') ||
    qLowerPre.includes('lonely') || qLowerPre.includes('sad') || qLowerPre.includes('scared') ||
    qLowerPre.includes('anxious') || qLowerPre.includes('worried') || qLowerPre.includes('tired') ||
    qLowerPre.includes('udaas') || qLowerPre.includes('akelapan') || qLowerPre.includes('pareshan');

  if (isDeterministicIntent) {
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

        // Only open Neuromusic when the user EXPLICITLY asked to play music/a song.
        // Require BOTH a play-verb AND a music noun so that story/game/general queries never fire this.
        const hasPlayVerb = /\b(play|bajao|chalao|lagao|sunao|baja\s*do|chala\s*do|laga\s*do)\b/i.test(qLower);
        const hasMusicNoun = /\b(music|song|songs|gaana|gana|geet|sangeet|bhajan|bhajans|aarti|arti|kirtan|dhun|track|tracks|melody|tune)\b/i.test(qLower);
        // LLM may suggest music only when the user really asked for it
        const llmSuggestsMusic = parsed.suggestedApp === 'music' && hasPlayVerb && hasMusicNoun;
        const askedForMusic = llmSuggestsMusic || (hasPlayVerb && hasMusicNoun);

        const askedForGame =
          parsed.suggestedApp === 'game' ||
          parsed.suggestedApp === 'games' ||
          /\b(game|games|puzzle|khel|khelna)\b/i.test(qLower);


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
