/**
 * NeuroNova Patient Weather Context Service
 * Fetches real-time weather using OpenWeather API based on the patient's current GPS location.
 * IMPORTANT: Weather is NEVER rendered on the website UI — it is strictly used by the Voice Companion
 * to answer patient questions about the weather, clothing, or temperature.
 */

export interface PatientWeather {
  cityName: string;
  country?: string;
  tempC: number;
  tempF: number;
  feelsLikeC: number;
  condition: string;
  description: string;
  descriptionHi: string;
  humidity: number;
  windSpeedKmH: number;
  isRain: boolean;
  isCold: boolean;
  isWarm: boolean;
  elderAdviceEn: string;
  elderAdviceHi: string;
  source: 'openweather' | 'fallback_seasonal';
}

// In-memory cache with 15-minute TTL to prevent rate-limiting
interface CachedWeatherEntry {
  weather: PatientWeather;
  cachedAt: number;
}

const weatherCache = new Map<string, CachedWeatherEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

const CONDITION_HINDI_MAP: Record<string, string> = {
  clear: 'साफ़ और खुला',
  clouds: 'हल्के बादल',
  rain: 'बारिश',
  drizzle: 'हल्की बूंदाबांदी',
  thunderstorm: 'गरज के साथ बारिश',
  snow: 'बर्फ़बारी',
  mist: 'हल्की धुंध',
  fog: 'कोहरा',
  haze: 'धुंध भरा',
  smoke: 'धुंध भरा',
};

function translateConditionToHindi(condition: string, description: string): string {
  const condLower = (condition || '').toLowerCase();
  const descLower = (description || '').toLowerCase();
  for (const [key, val] of Object.entries(CONDITION_HINDI_MAP)) {
    if (condLower.includes(key) || descLower.includes(key)) {
      return val;
    }
  }
  return 'शांत और सुहावना';
}

function buildElderAdvice(tempC: number, condition: string, isRain: boolean): { en: string; hi: string } {
  if (isRain) {
    return {
      en: 'It is rainy outside, so it is best to stay warm and comfortable indoors with a hot cup of tea.',
      hi: 'बाहर बारिश हो रही है, इसलिए घर के अंदर आराम से रहना और गर्म चाय या पानी पीना सबसे अच्छा रहेगा।',
    };
  }
  if (tempC <= 18) {
    return {
      en: 'It is a bit cool outside. Please keep a light sweater or shawl handy to stay cozy.',
      hi: 'बाहर हल्की ठंडक है। कृपया आरामदेह शॉल या हल्का स्वेटर पहन कर रखें।',
    };
  }
  if (tempC >= 33) {
    return {
      en: 'It is quite warm outside today. Make sure to stay comfortably in the shade and sip fresh water regularly.',
      hi: 'आज बाहर थोड़ी गर्मी है। कृपया समय-समय पर पानी पीते रहें और आराम से रहें।',
    };
  }
  return {
    en: 'The temperature is pleasant and comfortable. A wonderful time to sit by the window or listen to peaceful music.',
    hi: 'मौसम बहुत शांत और सुहावना है। खिड़की के पास बैठने या मधुर संगीत सुनने के लिए यह बहुत अच्छा समय है।',
  };
}

/**
 * Fallback weather estimation when OpenWeather key is propagating or device is offline
 */
function getSeasonalFallbackWeather(lat?: number, lon?: number, cityName = 'Your City'): PatientWeather {
  const now = new Date();
  const hours = now.getHours();
  const isNight = hours >= 19 || hours < 6;

  // Reasonable ambient temperature estimate based on time of day
  const tempC = isNight ? 24 : 29;
  const tempF = Math.round((tempC * 9) / 5 + 32);
  const condition = isNight ? 'Clear' : 'Partly Cloudy';
  const description = isNight ? 'clear starry night' : 'pleasant sky with gentle breeze';
  const advice = buildElderAdvice(tempC, condition, false);

  return {
    cityName: cityName || 'Your area',
    tempC,
    tempF,
    feelsLikeC: tempC,
    condition,
    description,
    descriptionHi: translateConditionToHindi(condition, description),
    humidity: 55,
    windSpeedKmH: 10,
    isRain: false,
    isCold: false,
    isWarm: false,
    elderAdviceEn: advice.en,
    elderAdviceHi: advice.hi,
    source: 'fallback_seasonal',
  };
}

/**
 * Fetch patient's local weather using OpenWeather API
 */
export async function getPatientWeather(
  lat?: number,
  lon?: number,
  defaultCity?: string
): Promise<PatientWeather> {
  const apiKey = (process.env.OPENWEATHER_API_KEY || '84755500f42868d2622555cb4d0ce383').trim();

  // Create cache key based on coordinates or city
  const cacheKey = lat !== undefined && lon !== undefined
    ? `${lat.toFixed(2)}_${lon.toFixed(2)}`
    : (defaultCity || 'default_location').toLowerCase();

  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.weather;
  }

  // Construct OpenWeatherMap endpoint URL
  let url = '';
  if (lat !== undefined && lon !== undefined && !isNaN(lat) && !isNaN(lon)) {
    url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  } else if (defaultCity) {
    url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(defaultCity)}&appid=${apiKey}&units=metric`;
  } else {
    // Default to Delhi, India coordinates if patient coordinates unavailable
    url = `https://api.openweathermap.org/data/2.5/weather?lat=28.6139&lon=77.2090&appid=${apiKey}&units=metric`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errBody = await res.text();
      console.warn(`[WeatherService] OpenWeather API responded with status ${res.status}: ${errBody}`);
      // OpenWeather keys take a few minutes to activate globally after creation
      const fallback = getSeasonalFallbackWeather(lat, lon, defaultCity);
      weatherCache.set(cacheKey, { weather: fallback, cachedAt: Date.now() });
      return fallback;
    }

    const data: any = await res.json();
    const cityName = data.name || defaultCity || 'Your neighborhood';
    const tempC = Math.round(data.main?.temp ?? 26);
    const tempF = Math.round((tempC * 9) / 5 + 32);
    const feelsLikeC = Math.round(data.main?.feels_like ?? tempC);
    const condition = data.weather?.[0]?.main || 'Clear';
    const description = data.weather?.[0]?.description || 'clear skies';
    const humidity = data.main?.humidity || 50;
    const windSpeedKmH = Math.round((data.wind?.speed || 0) * 3.6);

    const isRain = /rain|drizzle|thunderstorm/i.test(condition) || /rain|drizzle/i.test(description);
    const isCold = tempC <= 18;
    const isWarm = tempC >= 32;

    const advice = buildElderAdvice(tempC, condition, isRain);

    const weather: PatientWeather = {
      cityName,
      country: data.sys?.country,
      tempC,
      tempF,
      feelsLikeC,
      condition,
      description,
      descriptionHi: translateConditionToHindi(condition, description),
      humidity,
      windSpeedKmH,
      isRain,
      isCold,
      isWarm,
      elderAdviceEn: advice.en,
      elderAdviceHi: advice.hi,
      source: 'openweather',
    };

    weatherCache.set(cacheKey, { weather, cachedAt: Date.now() });
    return weather;
  } catch (err: any) {
    console.warn('[WeatherService] Error fetching live weather, using graceful fallback:', err?.message);
    const fallback = getSeasonalFallbackWeather(lat, lon, defaultCity);
    weatherCache.set(cacheKey, { weather: fallback, cachedAt: Date.now() });
    return fallback;
  }
}
