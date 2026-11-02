import { db } from '../db.js';
import { getPatientTasks, createNotification, getPatientLinkedCaregivers } from '../userDataService.js';
import { notifyCaregiversOfPatient } from '../realtime/socketManager.js';

// Cache to prevent duplicate notifications on the same day for the same task
// key: `${patientId}_${taskId}_${dateStr}`
const notifiedMissedTasks = new Set<string>();

export function checkMissedTasks(): void {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Query all distinct patient IDs from users table
    const patientRows = db.prepare(`SELECT id, name FROM users WHERE role = 'patient'`).all() as any[];

    for (const p of patientRows) {
      const patientId = p.id;
      const patientName = p.name || 'Patient';
      const tasks = getPatientTasks(patientId, todayStr);

      for (const t of tasks) {
        if (t.isCompletedToday) continue;
        if (!t.scheduledTime) continue;

        const [h, m] = t.scheduledTime.split(':').map(Number);
        const scheduledMinutes = h * 60 + (m || 0);
        const gracePeriod = t.gracePeriodMinutes || 30;
        const deadlineMinutes = scheduledMinutes + gracePeriod;

        // If deadline has passed and not completed
        if (currentMinutes > deadlineMinutes) {
          const cacheKey = `${patientId}_${t.id}_${todayStr}`;
          if (!notifiedMissedTasks.has(cacheKey)) {
            notifiedMissedTasks.add(cacheKey);

            console.log(`[Task Scheduler] Missed task detected: "${t.title}" for ${patientName} (${patientId})`);

            // Find linked caregivers
            const linkedCaregivers = getPatientLinkedCaregivers(patientId);
            const title = `Missed Routine Task: ${t.title}`;
            const message = `${patientName} did not complete their scheduled ${t.type} ("${t.title}") scheduled for ${t.scheduledTime}.`;

            linkedCaregivers.forEach((cg) => {
              const cgId = cg.caregiverId || cg.caregiver_id;
              if (cgId) {
                // Persist notification in database
                createNotification({
                  recipientId: cgId,
                  type: 'MISSED_TASK',
                  title,
                  message,
                  relatedEntityId: t.id,
                });
              }
            });

            // Dispatch real-time WebSocket event
            notifyCaregiversOfPatient(patientId, 'patient:task:missed', {
              patientId,
              patientName,
              taskId: t.id,
              title: t.title,
              taskTitle: t.title,
              taskType: t.type,
              scheduledTime: t.scheduledTime,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('[Task Scheduler] Error checking missed tasks:', err);
  }
}

let schedulerTimer: NodeJS.Timeout | null = null;

export function startMissedTaskScheduler(intervalMs: number = 60000): void {
  if (schedulerTimer) return;
  // Initial check
  checkMissedTasks();
  schedulerTimer = setInterval(checkMissedTasks, intervalMs);
  console.log(`[Task Scheduler] Missed task monitor running every ${intervalMs / 1000}s`);
}

export function stopMissedTaskScheduler(): void {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
}
