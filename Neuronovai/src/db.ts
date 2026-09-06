import fs from 'fs';
import path from 'path';
// @ts-ignore
import { DatabaseSync } from 'node:sqlite';

// Ensure data directory exists relative to project root
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

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

    CREATE INDEX IF NOT EXISTS idx_liked_user ON liked_songs(user_id);
    CREATE INDEX IF NOT EXISTS idx_games_user ON game_results(user_id);
    CREATE INDEX IF NOT EXISTS idx_routine_user_date ON routine_logs(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_playlists_user ON user_playlists(user_id);
    CREATE INDEX IF NOT EXISTS idx_links_caregiver ON patient_caregiver_links(caregiver_id);
    CREATE INDEX IF NOT EXISTS idx_links_patient ON patient_caregiver_links(patient_id);
    CREATE INDEX IF NOT EXISTS idx_invite_code ON patient_invite_codes(invite_code);
    CREATE INDEX IF NOT EXISTS idx_history_user ON music_listening_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_history_play_count ON music_listening_history(user_id, play_count DESC);
    CREATE INDEX IF NOT EXISTS idx_voice_logs_user_date ON voice_assistant_logs(user_id, created_at);
  `);
  console.log(`[Database] SQLite initialized at ${dbPath}`);
}
