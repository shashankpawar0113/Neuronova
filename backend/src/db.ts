import fs from 'fs';
import path from 'path';
// @ts-ignore
import { DatabaseSync } from 'node:sqlite';

import os from 'os';

// Ensure data directory exists. On Vercel / serverless platforms, only /tmp (os.tmpdir()) is writable!
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
const dataDir = isServerless 
  ? os.tmpdir() 
  : path.resolve(process.cwd(), 'data');

try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
} catch (_) {}

const dbPath = path.join(dataDir, 'neuronova.db');

export const db = new DatabaseSync(dbPath);

// Initialize Tables
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email_or_phone TEXT,
      role TEXT DEFAULT 'patient',
      created_at TEXT DEFAULT (datetime('now')),
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS liked_songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      song_id TEXT NOT NULL,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      album_art TEXT,
      duration_seconds INTEGER,
      duration_minutes REAL,
      formatted_duration TEXT,
      genre TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, song_id)
    );

    CREATE TABLE IF NOT EXISTS user_playlists (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT,
      tracks_json TEXT,
      created_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS game_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      game_type TEXT NOT NULL,
      level INTEGER NOT NULL,
      accuracy INTEGER NOT NULL,
      response_time_ms INTEGER NOT NULL,
      attempts INTEGER NOT NULL,
      combinations_reached INTEGER DEFAULT NULL,
      timestamp TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS routine_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      routine_id TEXT NOT NULL,
      title TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      scheduled_time TEXT,
      date TEXT NOT NULL,
      completed_at TEXT,
      UNIQUE(user_id, routine_id, date)
    );

    CREATE TABLE IF NOT EXISTS mood_checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      mood TEXT NOT NULL,
      energy_level INTEGER,
      notes TEXT,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS patient_caregiver_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id TEXT NOT NULL,
      caregiver_id TEXT NOT NULL,
      relationship TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      requested_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      approved_at TEXT,
      UNIQUE(patient_id, caregiver_id)
    );

    CREATE TABLE IF NOT EXISTS patient_invite_codes (
      patient_id TEXT PRIMARY KEY,
      invite_code TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS music_listening_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      song_id TEXT NOT NULL,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      album_art TEXT,
      duration_seconds INTEGER,
      duration_minutes REAL,
      formatted_duration TEXT,
      genre TEXT,
      played_at INTEGER NOT NULL,
      play_count INTEGER DEFAULT 1,
      UNIQUE(user_id, song_id)
    );

    CREATE TABLE IF NOT EXISTS voice_assistant_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      user_name TEXT,
      raw_question TEXT NOT NULL,
      translated_question TEXT,
      detected_language TEXT DEFAULT 'en',
      intent TEXT NOT NULL,
      reply_text TEXT NOT NULL,
      spoken_reply TEXT,
      action_label TEXT,
      action_url TEXT,
      action_icon TEXT,
      song_name TEXT,
      source TEXT DEFAULT 'action_execution',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ai_cognitive_evaluations (
      patient_id TEXT PRIMARY KEY,
      analysis_json TEXT NOT NULL,
      source TEXT NOT NULL,
      model_used TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS daily_motivational_messages (
      message_date TEXT NOT NULL,
      user_key TEXT NOT NULL,
      message TEXT NOT NULL,
      theme TEXT,
      model_used TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY(message_date, user_key)
    );

    CREATE TABLE IF NOT EXISTS patient_tasks (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      recurrence TEXT DEFAULT 'daily',
      grace_period_minutes INTEGER DEFAULT 30,
      is_active INTEGER DEFAULT 1,
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS task_completion_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT NOT NULL,
      patient_id TEXT NOT NULL,
      date TEXT NOT NULL,
      completed_at TEXT DEFAULT (datetime('now')),
      completed_by TEXT DEFAULT 'patient',
      notes TEXT,
      UNIQUE(task_id, date)
    );

    CREATE TABLE IF NOT EXISTS voice_messages (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      patient_name TEXT NOT NULL,
      caregiver_id TEXT NOT NULL,
      transcript TEXT NOT NULL,
      audio_filename TEXT NOT NULL,
      duration_seconds INTEGER DEFAULT 0,
      status TEXT DEFAULT 'unread',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      recipient_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      related_entity_id TEXT,
      read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS call_sessions (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      caregiver_id TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at TEXT DEFAULT (datetime('now')),
      ended_at TEXT,
      duration_seconds INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS emergency_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id TEXT NOT NULL,
      name TEXT NOT NULL,
      relationship TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      is_primary INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS patient_unique_ids (
      patient_id TEXT PRIMARY KEY,
      unique_patient_id TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS health_worker_profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      organization TEXT,
      phone TEXT,
      email TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS health_worker_patient_access (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id TEXT NOT NULL,
      patient_id TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      authorized_at TEXT DEFAULT (datetime('now')),
      authorized_by TEXT DEFAULT 'admin',
      UNIQUE(worker_id, patient_id)
    );

    CREATE TABLE IF NOT EXISTS health_worker_concerns (
      id TEXT PRIMARY KEY,
      worker_id TEXT NOT NULL,
      patient_id TEXT NOT NULL,
      concern_type TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS health_worker_access_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id TEXT NOT NULL,
      patient_id TEXT NOT NULL,
      action TEXT NOT NULL,
      timestamp TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_liked_user ON liked_songs(user_id);
    CREATE TABLE IF NOT EXISTS medical_reports (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      caregiver_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'other',
      file_name TEXT NOT NULL,
      stored_filename TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL DEFAULT 0,
      report_date TEXT,
      doctor_name TEXT,
      hospital_clinic TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_games_user ON game_results(user_id);
    CREATE INDEX IF NOT EXISTS idx_routine_user_date ON routine_logs(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_playlists_user ON user_playlists(user_id);
    CREATE INDEX IF NOT EXISTS idx_links_caregiver ON patient_caregiver_links(caregiver_id);
    CREATE INDEX IF NOT EXISTS idx_links_patient ON patient_caregiver_links(patient_id);
    CREATE INDEX IF NOT EXISTS idx_invite_code ON patient_invite_codes(invite_code);
    CREATE INDEX IF NOT EXISTS idx_history_user ON music_listening_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_history_play_count ON music_listening_history(user_id, play_count DESC);
    CREATE INDEX IF NOT EXISTS idx_tasks_patient ON patient_tasks(patient_id);
    CREATE INDEX IF NOT EXISTS idx_task_completion ON task_completion_logs(task_id, date);
    CREATE INDEX IF NOT EXISTS idx_voice_msg_caregiver ON voice_messages(caregiver_id);
    CREATE INDEX IF NOT EXISTS idx_notif_recipient ON notifications(recipient_id);
    CREATE INDEX IF NOT EXISTS idx_unique_patient_id ON patient_unique_ids(unique_patient_id);
    CREATE INDEX IF NOT EXISTS idx_hw_access_worker ON health_worker_patient_access(worker_id);
    CREATE INDEX IF NOT EXISTS idx_hw_concerns_patient ON health_worker_concerns(patient_id);
    CREATE INDEX IF NOT EXISTS idx_med_reports_patient ON medical_reports(patient_id);
    CREATE INDEX IF NOT EXISTS idx_med_reports_caregiver ON medical_reports(caregiver_id);
  `);

  try {
    db.exec(`ALTER TABLE game_results ADD COLUMN combinations_reached INTEGER DEFAULT NULL`);
  } catch (_) {}

  try {
    db.exec(`ALTER TABLE users ADD COLUMN preferred_language TEXT DEFAULT 'en'`);
  } catch (_) {}

  try {
    db.exec(`ALTER TABLE users ADD COLUMN unique_patient_id TEXT DEFAULT NULL`);
  } catch (_) {}

  try {
    db.exec(`ALTER TABLE health_worker_patient_access ADD COLUMN worker_name TEXT DEFAULT NULL`);
  } catch (_) {}

  try {
    db.exec(`ALTER TABLE health_worker_patient_access ADD COLUMN organization TEXT DEFAULT NULL`);
  } catch (_) {}

  try {
    db.exec(`ALTER TABLE health_worker_patient_access ADD COLUMN requested_at TEXT DEFAULT NULL`);
  } catch (_) {}

  try {
    db.exec(`ALTER TABLE voice_messages ADD COLUMN is_important INTEGER DEFAULT 0`);
  } catch (_) {}

  console.log(`[Database] SQLite initialized at ${dbPath}`);
}


// Auto-initialize tables immediately upon load
try {
  initDatabase();
} catch (err) {
  console.warn('[Database] Auto-init tables error:', err);
}
