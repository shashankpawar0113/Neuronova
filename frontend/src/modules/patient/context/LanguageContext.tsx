import React, { createContext, useContext, useState, useEffect } from 'react';
import { BACKEND_URL } from '../config/urls';

export type LanguageCode = 'en' | 'hi' | 'hinglish';

export interface TranslationsType {
  greetings: {
    morning: string;
    afternoon: string;
    evening: string;
    night: string;
  };
  header: {
    dailyThought: string;
    aiWellness: string;
    timeDateTitle: string;
  };
  systemControls: {
    title: string;
    caregiverBadge: string;
    displaySettings: string;
    accessibilitySub: string;
    languageOption: string;
    languageSub: string;
    signOut: string;
    signOutSub: string;
  };
  streak: {
    brightMoments: (days: number) => string;
    gentleRoutineBadge: string;
    gentleCareSubtitle: string;
    personalProgress: string;
    improvedText: (pct: number) => string;
    weeklyReflection: string;
    strongestIn: (dim: string) => string;
    reflectionLoading: string;
  };
  routine: {
    title: string;
    tagline: string;
    fullScheduleBtn: string;
    nextUp: string;
    doneBtn: string;
    remindLaterBtn: string;
    allDoneToday: string;
    allDoneDesc: string;
    timeLabels: {
      now: string;
      inMinutes: (m: number) => string;
      atTime: (time: string) => string;
    };
  };
  heroCards: {
    games: {
      title: string;
      tagline: string;
      description: string;
      badge: string;
    };
    routine: {
      title: string;
      tagline: string;
      description: string;
      badge: string;
    };
    vault: {
      title: string;
      tagline: string;
      description: string;
      badge: string;
    };
    music: {
      title: string;
      tagline: string;
      description: string;
      badge: string;
    };
  };
  footer: {
    companionNote: string;
  };
  modal: {
    title: string;
    subtitle: string;
    continueBtn: string;
  };
}

export const TRANSLATIONS: Record<LanguageCode, TranslationsType> = {
  en: {
    greetings: {
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
      night: 'Good night',
    },
    header: {
      dailyThought: 'Daily Thought',
      aiWellness: 'AI Wellness',
      timeDateTitle: 'Current Time & Date (Triple-tap for system options)',
    },
    systemControls: {
      title: 'System Controls',
      caregiverBadge: 'Caregiver',
      displaySettings: 'Display & Font Settings',
      accessibilitySub: 'Accessibility, text size',
      languageOption: 'Language / भाषा',
      languageSub: 'English, हिन्दी, Hinglish',
      signOut: 'Sign Out',
      signOutSub: 'Exit patient session',
    },
    streak: {
      brightMoments: (days: number) => `${days} Days of Bright Moments`,
      gentleRoutineBadge: 'Gentle Routine',
      gentleCareSubtitle: "You've taken gentle care of your mind each morning.",
      personalProgress: 'Personal Progress',
      improvedText: (pct: number) => `You improved +${pct}% compared with last week!`,
      weeklyReflection: 'Weekly Cognitive Reflection',
      strongestIn: (dim: string) => `Strongest in ${dim}`,
      reflectionLoading: 'Gathering your warm weekly reflection...',
    },
    routine: {
      title: "Today's Routine & Medicine",
      tagline: 'Gentle Daily Flow',
      fullScheduleBtn: 'View full schedule',
      nextUp: 'Next up',
      doneBtn: 'Done',
      remindLaterBtn: 'Remind me later',
      allDoneToday: 'All caught up for today!',
      allDoneDesc: "You have completed all scheduled tasks. Rest well and enjoy your day.",
      timeLabels: {
        now: 'Due now',
        inMinutes: (m: number) => `In ${m} min`,
        atTime: (time: string) => `At ${time}`,
      },
    },
    heroCards: {
      games: {
        title: 'Neurogames',
        tagline: 'Keep Your Mind Refreshed',
        description: 'Playful daily memory puzzles and sequence games crafted with joy.',
        badge: 'Memory Match • Attention • Sequence',
      },
      routine: {
        title: "Today's Routine & Medicine",
        tagline: 'Gentle Daily Flow',
        description: 'Your medicine schedule, water reminders, and peaceful walking times.',
        badge: '7 daily gentle milestones',
      },
      vault: {
        title: 'Family Memory Vault',
        tagline: 'Stories & Loved Ones',
        description: 'Cherished photos, family recordings, and familiar faces you love.',
        badge: 'Family photos & audio voice notes',
      },
      music: {
        title: 'Music & Nostalgia',
        tagline: 'Peaceful Melodies',
        description: 'Calming instrumental melodies and timeless songs from your favorite eras.',
        badge: 'Relaxing ragas, old classics & hymns',
      },
    },
    footer: {
      companionNote: 'NeuroNova Daily Companion • Designed with dignity, patience, and love for our elders.',
    },
    modal: {
      title: 'Select App & Voice Language',
      subtitle: 'Choose your comfortable language for the entire home experience',
      continueBtn: 'Continue / आगे बढ़ें',
    },
  },

  hi: {
    greetings: {
      morning: 'शुभ प्रभात',
      afternoon: 'शुभ दोपहर',
      evening: 'शुभ संध्या',
      night: 'शुभ रात्रि',
    },
    header: {
      dailyThought: 'दैनिक विचार',
      aiWellness: 'एआई स्वास्थ्य साथी',
      timeDateTitle: 'वर्तमान समय व दिनांक (तीन बार टैप करें)',
    },
    systemControls: {
      title: 'सिस्टम नियंत्रण',
      caregiverBadge: 'केयरगिवर',
      displaySettings: 'डिस्प्ले और फ़ॉन्ट सेटिंग्स',
      accessibilitySub: 'सुलभता, टेक्स्ट का आकार',
      languageOption: 'भाषा चयन (Language)',
      languageSub: 'हिन्दी, English, Hinglish',
      signOut: 'साइन आउट',
      signOutSub: 'सत्र समाप्त करें',
    },
    streak: {
      brightMoments: (days: number) => `${days} दिनों की सुंदर लय`,
      gentleRoutineBadge: 'दैनिक दिनचर्या',
      gentleCareSubtitle: 'आपने हर सुबह अपने मन और स्वास्थ्य का प्रेमपूर्वक ध्यान रखा है।',
      personalProgress: 'आपकी प्रगति',
      improvedText: (pct: number) => `पिछले सप्ताह की तुलना में +${pct}% सुधार हुआ है!`,
      weeklyReflection: 'साप्ताहिक मानसिक चिंतन',
      strongestIn: (dim: string) => `${dim} में सबसे उत्तम प्रदर्शन`,
      reflectionLoading: 'आपकी साप्ताहिक प्रगति रिपोर्ट तैयार की जा रही है...',
    },
    routine: {
      title: 'आज की दिनचर्या और दवाइयाँ',
      tagline: 'सहज दैनिक प्रवाह',
      fullScheduleBtn: 'पूरा शेड्यूल देखें',
      nextUp: 'अगला कार्य',
      doneBtn: 'हो गया (Done)',
      remindLaterBtn: 'बाद में याद दिलाएँ',
      allDoneToday: 'आज के सभी कार्य संपन्न!',
      allDoneDesc: 'आपने आज के सभी निर्धारित कार्य पूरे कर लिए हैं। विश्राम करें और आनंद लें।',
      timeLabels: {
        now: 'अभी का समय',
        inMinutes: (m: number) => `${m} मिनट में`,
        atTime: (time: string) => `${time} बजे`,
      },
    },
    heroCards: {
      games: {
        title: 'दिमागी खेल (Neurogames)',
        tagline: 'दिमाग को तरोताज़ा रखें',
        description: 'याददाश्त और एकाग्रता को सक्रिय रखने वाले सहज व रोचक खेल।',
        badge: 'मेमोरी मैच • एकाग्रता • क्रम खेल',
      },
      routine: {
        title: 'दैनिक दिनचर्या और दवाइयाँ',
        tagline: 'सहज दैनिक दिनचर्या',
        description: 'दवाइयों का समय, पानी पीने की याद और सुबह-शाम टहलने का समय।',
        badge: '7 दैनिक महत्वपूर्ण कार्य',
      },
      vault: {
        title: 'परिवार की यादें (Memory Vault)',
        tagline: 'कहानियाँ और अपने',
        description: 'परिवार की पुरानी तस्वीरें, प्रियजनों की आवाज़ें और अनमोल लम्हे।',
        badge: 'पारिवारिक तस्वीरें व वॉइस नोट्स',
      },
      music: {
        title: 'संगीत और मधुर यादें',
        tagline: 'शांत और पावन धुनें',
        description: 'मन को शांति देने वाले मधुर भजन, पुराने क्लासिक गीत और शांतिदायक संगीत।',
        badge: 'राग, पुराने गीत और भजन',
      },
    },
    footer: {
      companionNote: 'न्यूरोनोवा दैनिक साथी • हमारे बुज़ुर्गों के लिए सम्मान, धैर्य और प्रेम के साथ समर्पित।',
    },
    modal: {
      title: 'ऐप व आवाज़ की भाषा चुनें',
      subtitle: 'आप मुझसे और इस ऐप से किस भाषा में बात करना पसंद करेंगे?',
      continueBtn: 'आगे बढ़ें / Continue',
    },
  },

  hinglish: {
    greetings: {
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
      night: 'Good night',
    },
    header: {
      dailyThought: 'Daily Thought',
      aiWellness: 'AI Wellness Partner',
      timeDateTitle: 'Time aur Date (Triple tap for options)',
    },
    systemControls: {
      title: 'System Controls',
      caregiverBadge: 'Caregiver',
      displaySettings: 'Display & Font Settings',
      accessibilitySub: 'Text size aur visual comfort',
      languageOption: 'Language / भाषा',
      languageSub: 'Hinglish, हिन्दी, English',
      signOut: 'Sign Out',
      signOutSub: 'Session se exit karein',
    },
    streak: {
      brightMoments: (days: number) => `${days} Days ki Bright Moments`,
      gentleRoutineBadge: 'Gentle Routine',
      gentleCareSubtitle: 'Aapne har subah apne man aur routine ka dhyan rakha hai.',
      personalProgress: 'Personal Progress',
      improvedText: (pct: number) => `Pichhle week ke mukable +${pct}% behtar progress!`,
      weeklyReflection: 'Weekly Reflection',
      strongestIn: (dim: string) => `${dim} me sabse strong performance`,
      reflectionLoading: 'Aapka weekly reflection gather ho raha hai...',
    },
    routine: {
      title: "Aaj ka Routine & Dawai",
      tagline: 'Gentle Daily Flow',
      fullScheduleBtn: 'Poora schedule dekhein',
      nextUp: 'Next task',
      doneBtn: 'Done / Ho gaya',
      remindLaterBtn: 'Baad me yaad dilao',
      allDoneToday: 'Aaj ke sabhi tasks complete!',
      allDoneDesc: 'Aapne aaj ke sabhi routine tasks poore kar liye hain. Relax karein aur enjoy karein.',
      timeLabels: {
        now: 'Abhi ka time',
        inMinutes: (m: number) => `${m} min me`,
        atTime: (time: string) => `${time} par`,
      },
    },
    heroCards: {
      games: {
        title: 'Neurogames (दिमागी खेल)',
        tagline: 'Mind ko Refreshed Rakhein',
        description: 'Memory puzzles aur sequence games jo man ko khush aur active rakhein.',
        badge: 'Memory Match • Attention • Sequence',
      },
      routine: {
        title: "Today's Routine & Medicine",
        tagline: 'Daily Medicine & Care',
        description: 'Medicine schedule, paani peene ka reminder aur walking time.',
        badge: '7 gentle daily milestones',
      },
      vault: {
        title: 'Family Memory Vault',
        tagline: 'Apno ki Yaadein',
        description: 'Family photos, purani yaadein aur loved ones ke voice messages.',
        badge: 'Family photos & voice notes',
      },
      music: {
        title: 'Music & Memories',
        tagline: 'Peaceful Melodies',
        description: 'Shant instrumental music, bhajan aur aapke manpasand evergreen gaane.',
        badge: 'Evergreen songs, bhajans & ragas',
      },
    },
    footer: {
      companionNote: 'NeuroNova Daily Companion • Apno ke liye samman, patience aur pyaar ke saath.',
    },
    modal: {
      title: 'Select App & Voice Language',
      subtitle: 'Screen aur voice dono ke liye apni comfortable language chuniye',
      continueBtn: 'Continue / आगे बढ़ें',
    },
  },
};

interface LanguageContextProps {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: TranslationsType;
}

const LanguageContext = createContext<LanguageContextProps>({
  language: 'hinglish',
  setLanguage: () => {},
  t: TRANSLATIONS.hinglish,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode; userId?: string }> = ({
  children,
  userId,
}) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      const stored = localStorage.getItem('neuronova_voice_lang') as LanguageCode;
      return stored && ['en', 'hi', 'hinglish'].includes(stored) ? stored : 'hinglish';
    } catch (_) {
      return 'hinglish';
    }
  });

  // Sync with backend on mount if available
  useEffect(() => {
    if (userId) {
      fetch(`${BACKEND_URL || 'http://localhost:5001'}/api/user/${userId}/language`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.language && ['en', 'hi', 'hinglish'].includes(data.language)) {
            setLanguageState(data.language);
            try {
              localStorage.setItem('neuronova_voice_lang', data.language);
              localStorage.setItem('neuronova_language_onboarded', 'true');
            } catch (_) {}
          }
        })
        .catch(() => {});
    }
  }, [userId]);

  // Listen for language changes from other parts of the app
  useEffect(() => {
    const handleLangEvent = (e: any) => {
      const newLang = e.detail?.language;
      if (newLang && ['en', 'hi', 'hinglish'].includes(newLang)) {
        setLanguageState(newLang);
      }
    };
    window.addEventListener('neuronova:language-changed', handleLangEvent);
    return () => window.removeEventListener('neuronova:language-changed', handleLangEvent);
  }, []);

  const setLanguage = (newLang: LanguageCode) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem('neuronova_voice_lang', newLang);
      localStorage.setItem('neuronova_language_onboarded', 'true');
    } catch (_) {}

    if (userId) {
      fetch(`${BACKEND_URL || 'http://localhost:5001'}/api/user/${userId}/language`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: newLang }),
      }).catch(() => {});
    }

    // Broadcast globally
    window.dispatchEvent(new CustomEvent('neuronova:language-changed', { detail: { language: newLang } }));
  };

  const t = TRANSLATIONS[language] || TRANSLATIONS.hinglish;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
