import { ClassifiedIntent } from '../intentClassifier.js';
import { getPatientTasks, completePatientTask, getCaregiverLinkedPatients, getPatientLinkedCaregivers } from '../userDataService.js';
import { notifyCaregiversOfPatient } from '../realtime/socketManager.js';
import { NEUROGAMES_URL, NEUROMUSIC_URL } from '../config/urls.js';

export interface VoiceActionResult {
  reply: string;
  displayReply: string;
  spokenReply: string;
  intent: string;
  actionDirective?: 'START_SEQUENTIAL_GAMES' | 'OPEN_VOICE_MESSENGER' | 'START_CALL' | 'PAUSE_MEDIA' | 'RESUME_MEDIA' | 'PLAY_TRACK';
  actionUrl?: string;
  actionLabel?: string;
  actionIcon?: string;
  autoRedirect?: boolean;
  isHindi: boolean;
  isHinglish: boolean;
  language: 'en' | 'hi' | 'hinglish';
  completedTask?: any;
  completed?: boolean;
  task?: any;
  ambiguousChoices?: string[];
  suggestedAction?: any;
}

export function executeVoiceAction(
  userId: string,
  userName: string,
  intent: ClassifiedIntent,
  rawQuestion: string
): VoiceActionResult {
  const lang = intent.language;
  const isHindi = lang === 'hi';
  const isHinglish = lang === 'hinglish';
  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();

  // 1. COMPLETE TASK
  if (intent.primaryIntent === 'COMPLETE_TASK') {
    const tasks = getPatientTasks(userId, todayStr);
    const requestedType = intent.entity?.taskType;

    // Filter active tasks matching type, or all non-completed tasks
    let candidates = tasks.filter(t => !t.isCompletedToday);
    if (requestedType && requestedType !== 'general') {
      const typeMatches = candidates.filter(t => t.type === requestedType);
      if (typeMatches.length > 0) {
        candidates = typeMatches;
      }
    }

    if (candidates.length === 0) {
      const replyEn = `All your tasks for today are already completed, ${userName}! Wonderful job!`;
      const replyHi = `आज के आपके सभी काम पहले से पूरे हो चुके हैं, ${userName}! बहुत बढ़िया!`;
      const replyHinglish = `Aapke aaj ke saare tasks pehle se complete ho chuke hain, ${userName}! Bahut badhiya!`;
      const finalReply = isHindi ? replyHi : isHinglish ? replyHinglish : replyEn;

      return {
        reply: replyEn,
        displayReply: finalReply,
        spokenReply: finalReply,
        intent: 'COMPLETE_TASK',
        isHindi,
        isHinglish,
        language: lang,
      };
    }

    // Check for ambiguity (e.g. multiple medicine tasks)
    if (candidates.length > 1 && requestedType === 'medication') {
      const choiceTitles = candidates.map(c => c.title);
      const replyEn = `Which medicine do you mean? You have "${candidates[0].title}" and "${candidates[1].title}".`;
      const replyHi = `आप कौन सी दवाई के बारे में कह रहे हैं? "${candidates[0].title}" या "${candidates[1].title}"?`;
      const replyHinglish = `Aap kaun si medicine ke baare mein bol rahe hain? "${candidates[0].title}" ya "${candidates[1].title}"?`;
      const finalReply = isHindi ? replyHi : isHinglish ? replyHinglish : replyEn;

      return {
        reply: replyEn,
        displayReply: finalReply,
        spokenReply: finalReply,
        intent: 'COMPLETE_TASK',
        isHindi,
        isHinglish,
        language: lang,
        ambiguousChoices: choiceTitles,
      };
    }

    // Complete the primary candidate
    const taskToComplete = candidates[0];
    const compResult = completePatientTask(taskToComplete.id, userId, todayStr, 'patient_voice');

    // Notify caregivers via WebSocket
    notifyCaregiversOfPatient(userId, 'patient:task:completed', {
      patientId: userId,
      patientName: userName,
      taskId: taskToComplete.id,
      taskTitle: taskToComplete.title,
      taskType: taskToComplete.type,
      scheduledTime: taskToComplete.scheduledTime,
      completedAt: new Date().toISOString(),
    });

    const replyEn = `Your ${taskToComplete.title} has been marked as completed. Well done!`;
    const replyHi = `आपकी "${taskToComplete.title}" पूरी हो गई दर्ज कर दी गई है। बहुत अच्छा!`;
    const replyHinglish = `Aapki "${taskToComplete.title}" complete mark ho gayi hai. Very good!`;
    const finalReply = isHindi ? replyHi : isHinglish ? replyHinglish : replyEn;

    return {
      reply: replyEn,
      displayReply: finalReply,
      spokenReply: finalReply,
      intent: 'COMPLETE_TASK',
      isHindi,
      isHinglish,
      language: lang,
      completedTask: compResult.task || taskToComplete,
      completed: true,
      task: compResult.task || taskToComplete,
    };
  }

  // 2. GET NEXT MEDICATION
  if (intent.primaryIntent === 'GET_NEXT_MEDICATION') {
    const tasks = getPatientTasks(userId, todayStr);
    const medTasks = tasks.filter(t => t.type === 'medication' && !t.isCompletedToday);

    if (medTasks.length > 0) {
      const nextMed = medTasks[0];
      const replyEn = `Your next medicine is "${nextMed.title}" scheduled at ${nextMed.scheduledTime}.`;
      const replyHi = `आपकी अगली दवाई "${nextMed.title}" समय ${nextMed.scheduledTime} पर है।`;
      const replyHinglish = `Aapki next medicine "${nextMed.title}" ${nextMed.scheduledTime} baje hai.`;
      const finalReply = isHindi ? replyHi : isHinglish ? replyHinglish : replyEn;

      return {
        reply: replyEn,
        displayReply: finalReply,
        spokenReply: finalReply,
        intent: 'GET_NEXT_MEDICATION',
        isHindi,
        isHinglish,
        language: lang,
      };
    } else {
      const replyEn = `You have completed all scheduled medications for today, ${userName}. Rest easy!`;
      const replyHi = `आज के लिए आपकी सभी दवाइयां पूरी हो चुकी हैं, ${userName}। आराम कीजिए!`;
      const replyHinglish = `Aapki aaj ki saari medicines complete ho chuki hain, ${userName}. Aaram kijiye!`;
      const finalReply = isHindi ? replyHi : isHinglish ? replyHinglish : replyEn;

      return {
        reply: replyEn,
        displayReply: finalReply,
        spokenReply: finalReply,
        intent: 'GET_NEXT_MEDICATION',
        isHindi,
        isHinglish,
        language: lang,
      };
    }
  }

  // 3. START GAMES (Voice Controlled Sequential Games)
  if (intent.primaryIntent === 'START_GAMES') {
    const replyEn = `Starting your gentle cognitive games session now, ${userName}. Settle in and enjoy!`;
    const replyHi = `${userName}, आपके लिए आज के दिमागी खेल शुरू कर रहे हैं। आराम से खेलिए!`;
    const replyHinglish = `${userName}, aapke liye gentle brain games shuru kar rahe hain. Enjoy kijiye!`;
    const finalReply = isHindi ? replyHi : isHinglish ? replyHinglish : replyEn;

    return {
      reply: replyEn,
      displayReply: finalReply,
      spokenReply: finalReply,
      intent: 'START_GAMES',
      actionDirective: 'START_SEQUENTIAL_GAMES',
      actionUrl: `${NEUROGAMES_URL}/?mode=sequential&session=new`,
      actionLabel: 'Play Neurogames',
      actionIcon: 'game',
      autoRedirect: true,
      isHindi,
      isHinglish,
      language: lang,
      suggestedAction: {
        label: 'Play Neurogames',
        url: `${NEUROGAMES_URL}/?mode=sequential&session=new`,
        icon: 'game',
      },
    };
  }

  // 4. SEND CAREGIVER MESSAGE
  if (intent.primaryIntent === 'SEND_CAREGIVER_MESSAGE') {
    const target = intent.entity?.targetPerson || 'Caregiver';
    const replyEn = `Opening voice message recorder for ${target}. Speak your message clearly.`;
    const replyHi = `${target} के लिए वॉइस मैसेज रिकॉर्डर खुल रहा है। अपना संदेश बोलिए।`;
    const replyHinglish = `${target} ke liye voice message recorder khul raha hai. Apna message boliye.`;
    const finalReply = isHindi ? replyHi : isHinglish ? replyHinglish : replyEn;

    return {
      reply: replyEn,
      displayReply: finalReply,
      spokenReply: finalReply,
      intent: 'SEND_CAREGIVER_MESSAGE',
      actionDirective: 'OPEN_VOICE_MESSENGER',
      isHindi,
      isHinglish,
      language: lang,
    };
  }

  // 5. CALL CAREGIVER
  if (intent.primaryIntent === 'CALL_CAREGIVER') {
    const target = intent.entity?.targetPerson || 'Caregiver';
    const replyEn = `Connecting real-time call to ${target} now.`;
    const replyHi = `आपके लिए ${target} को कॉल मिला रहे हैं।`;
    const replyHinglish = `Aapke liye ${target} ko call connect kar rahe hain.`;
    const finalReply = isHindi ? replyHi : isHinglish ? replyHinglish : replyEn;

    return {
      reply: replyEn,
      displayReply: finalReply,
      spokenReply: finalReply,
      intent: 'CALL_CAREGIVER',
      actionDirective: 'START_CALL',
      isHindi,
      isHinglish,
      language: lang,
    };
  }

  // 6. STOP ACTION
  if (intent.primaryIntent === 'STOP_ACTION' || intent.primaryIntent === 'CANCEL_ACTION') {
    const replyEn = `Action stopped. Take your time and rest peacefully.`;
    const replyHi = `गतिविधि रोक दी गई है। आराम कीजिए।`;
    const replyHinglish = `Ruk gaya hai. Aap aaram se rest kijiye.`;
    const finalReply = isHindi ? replyHi : isHinglish ? replyHinglish : replyEn;

    return {
      reply: replyEn,
      displayReply: finalReply,
      spokenReply: finalReply,
      intent: 'STOP_ACTION',
      actionDirective: 'PAUSE_MEDIA',
      isHindi,
      isHinglish,
      language: lang,
    };
  }

  // 7. HELP
  if (intent.primaryIntent === 'HELP') {
    const replyEn = `You can speak naturally to me. For example: "What do I have to do today?", "When is my next medicine?", "I took my medicine", "Play games", or "Call my caregiver".`;
    const replyHi = `आप मुझसे स्वाभाविक रूप से बात कर सकते हैं। जैसे: "आज मुझे क्या करना है?", "मेरी अगली दवाई कब है?", "मैंने दवाई ले ली", "मुझे गेम खेलना है", या "केयरगिवर को कॉल करो"।`;
    const replyHinglish = `Aap mujhse naturally bol sakte hain. Jaise: "Aaj mujhe kya karna hai?", "Meri next medicine kab hai?", "Maine medicine le li", "Game khelna hai", ya "Caregiver ko call karo".`;
    const finalReply = isHindi ? replyHi : isHinglish ? replyHinglish : replyEn;

    return {
      reply: replyEn,
      displayReply: finalReply,
      spokenReply: finalReply,
      intent: 'HELP',
      isHindi,
      isHinglish,
      language: lang,
    };
  }

  // Default fallback
  const replyEn = `I am here with you, ${userName}. How can I assist you right now?`;
  const replyHi = `मैं आपके साथ हूँ, ${userName}। बताइए मैं आपकी क्या सहायता कर सकता हूँ?`;
  const replyHinglish = `Main aapke saath hoon, ${userName}. Boliye main aapki kya madad kar sakta hoon?`;
  const finalReply = isHindi ? replyHi : isHinglish ? replyHinglish : replyEn;

  return {
    reply: replyEn,
    displayReply: finalReply,
    spokenReply: finalReply,
    intent: 'OPEN_ENDED',
    isHindi,
    isHinglish,
    language: lang,
  };
}
