# NeuroNova Technical Design & Architecture Specification

## 1. PROJECT OVERVIEW

### 1.1 Purpose and Scope
NeuroNova is a distributed, multi-role digital care companion engineered to assist elders living with mild cognitive impairment (MCI) or early-stage dementia, their primary family caregivers, and community healthcare workers (such as Accredited Social Health Activists / ASHAs and outpatient clinicians). NeuroNova addresses the cognitive, emotional, and coordination burdens associated with neurological decline by delivering an integrated suite of non-pharmacological interventions:
1. **Daily Routine & Temporal Memory Support:** Large-format, low-cognitive-load orientation interfaces featuring daily routine milestone tracking, visual medicine schedules, and temporal grounding (day, date, live ticking clock).
2. **AI-Curated Formative Music Therapy:** Culturally attuned audio therapy leveraging formative-era Indian classical ragas, vintage film music (1960s–1980s), and meditative sitar instrumentals designed to stimulate autobiographical memory recall through the Reminiscence Bump phenomenon without provoking sensory overstimulation.
3. **Structured Cognitive Stimulation (Neurogames):** Daily gamified cognitive exercises spanning four distinct mental domains (Visual Working Memory, Focused Attention, Sequence Recall, and Cultural/Associative Heritage Memory).
4. **Caregiver Telemetry & Narrative Oversight:** Longitudinal performance analytics, medicine adherence tracking, voice companion interaction transcripts, and deterministic-statistical progress summaries synthesized into compassionate, clinical-grade narrative observations for family caregivers.

### 1.2 Clinical & Medical Disclaimer (Mandatory Safety Notice)
> [!IMPORTANT]
> **SAFETY & MEDICAL DEVICE NOTICE**  
> NeuroNova is an assistive wellness, memory stimulation, and caregiver communication platform. **It is NOT a medical device, diagnostic instrument, or clinical treatment tool.**  
> - None of the cognitive evaluations, progress percentages, or AI-generated observations produced by this software constitute a clinical diagnosis of Alzheimer’s disease, vascular dementia, or any other neurocognitive condition.  
> - NeuroNova must never be used as a substitute for professional medical advice, clinical diagnosis, bedside assessment, or formal treatment regimens prescribed by licensed neurologists, geriatricians, or psychiatrists.  
> - In any acute psychiatric or medical emergency (e.g., sudden confusion, delirium, suspected stroke, unassisted falls, or acute adverse medication reactions), users and caregivers must immediately contact localized emergency emergency services (such as 112/108 in India or 911 in North America) and seek immediate hospital care.

---

## 2. TECHNOLOGY STACK

The NeuroNova system is implemented as five autonomous micro-frontends paired with a unified AI orchestration and telemetry backend service.

### 2.1 Micro-Frontend Ecosystem
All five frontends are single-page applications (SPAs) compiled using modern build tooling, written in TypeScript, and styled with responsive, high-contrast, accessibility-first design tokens.

| Service Directory | Application Purpose | Core Framework | Bundler / Tooling | Styling Engine | Key Libraries & APIs | Port (Dev) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`authpage`** | Multi-role Authentication & Gateway Selector | React 19.0.0 (`react-dom` 19.0.0) | Vite 6.0.7, TypeScript ~5.7.2 | Tailwind CSS 3.4.17, PostCSS 8.5.1 | Firebase 12.18.0 (Client Auth), Lucide React 1.16.0 | `http://localhost:5174` |
| **`homepage`** | Patient Daily Companion & Voice Assistant | React 19.0.0 (`react-dom` 19.0.0) | Vite 6.0.7, TypeScript ~5.7.2 | Tailwind CSS 3.4.17, PostCSS 8.5.1 | Lucide React 1.16.0, Web Speech API (STT/TTS), Canvas Confetti | `http://localhost:5175` |
| **`caregiverpage`** | Caregiver Oversight Hub & Longitudinal Analytics | React 19.0.0 (`react-dom` 19.0.0) | Vite 6.0.7, TypeScript ~5.7.2 | Tailwind CSS 3.4.17, PostCSS 8.5.1 | Lucide React 1.16.0, Native SVG Interactive Charts | `http://localhost:5179` |
| **`Neuromusic`** | Formative Music Therapy Player & Contextual Queue | React 19.0.0 (`react-dom` 19.0.0) | Vite 6.0.7, TypeScript ~5.7.2 | Tailwind CSS 3.4.17, PostCSS 8.5.1 | YouTube IFrame Player API (`window.YT`), Lucide React 1.16.0 | `http://localhost:5177` |
| **`Neurogames`** | Cognitive Training Games (4 Mini-Games + Vault) | React 19.2.8 (`react-dom` 19.2.8) | Vite 8.2.2, TypeScript ~6.0.2 | Tailwind CSS 4.3.3 (`@tailwindcss/vite`), Oxlint | Lucide React 1.41.0, Canvas Confetti | `http://localhost:5178` |

> **Stack Note:** While `authpage`, `homepage`, `caregiverpage`, and `Neuromusic` standardize on Vite 6 and Tailwind CSS v3 with PostCSS, `Neurogames` operates on an upgraded Vite 8 and Tailwind CSS v4 toolchain utilizing native Vite CSS compilation plugins.

### 2.2 Backend & Data Persistence
The backend service (`Neuronovai`) is a centralized, high-performance Node.js service providing computational engines, persistent storage, third-party API brokering, and cross-micro-frontend command queues.
- **Runtime Environment:** Node.js v22.x LTS
- **Web Application Framework:** Express 5.2.1
- **Language / Transpilation:** TypeScript ~5.7.2 executed via `tsx` (v4.19.2) in development and compiled via `tsc` to ECMAScript Modules (`type: "module"`) for production.
- **Relational Database Driver:** Native Node.js synchronous SQLite (`node:sqlite` via `DatabaseSync`), requiring zero native C++ compilation bindings (e.g., `node-gyp` or `sqlite3`) and running against a localized SQLite database file at `Neuronovai/data/neuronova.db`.
- **Environment & Secrets:** `dotenv` (v16.4.7) strictly loaded on the server runtime.
- **Cross-Origin Resource Sharing:** `cors` (v2.8.5) configured with dynamic whitelist validation.

### 2.3 External APIs & Integration Status

| External Integration | Integration Mechanism | Status | Operational Role |
| :--- | :--- | :--- | :--- |
| **OpenRouter AI (GLM 5.2 / Llama 3.3)** | `@openrouter/sdk` (v0.2.1) + REST fallback | **LIVE / REAL** | Evaluates multi-day statistical trends, synthesizes caregiver narrative observations, and resolves open-ended patient voice queries with compassionate clinical tone. |
| **YouTube Data API v3** | Direct HTTPS REST queries to `googleapis.com/youtube/v3/search` and `/videos` | **LIVE / REAL** | Queries music databases, retrieves video metadata, fetches durations, and drives strict multi-stage safety content filtering. |
| **YouTube IFrame Player API** | Client-side dynamic script injection (`https://www.youtube.com/iframe_api`) | **LIVE / REAL** | Streams clean audio visualizers within an isolated DOM container in `Neuromusic`, managing playback states, time progress, and volume ducking. |
| **Firebase Authentication** | Firebase Web Client SDK v12 (`signInWithEmailAndPassword`, `createUserWithEmailAndPassword`) | **LIVE / REAL** | Manages user registration, session tokens, and identity persistence across the `authpage` gateway. |
| **SMS / Cellular Notifications** | Not integrated with Twilio or AWS SNS | **SIMULATED / IN-APP ONLY** | Medicine and routine reminders operate via client-side in-app banners, system modal dialogs, and browser toasts. No cellular SMS transmissions are sent. |
| **Community Health / Admin Dashboards** | Standalone route / UI placeholder | **SIMULATED / PROTOTYPE** | The ASHA worker and Hospital Administrator roles present interactive preview cards detailing planned caseload management features. |

### 2.4 Browser APIs & Language Boundaries
- **Speech-to-Text (STT):** Implemented via Web Speech API (`window.SpeechRecognition` or `window.webkitSpeechRecognition`).
- **Text-to-Speech (TTS):** Implemented via `window.speechSynthesis` and `SpeechSynthesisUtterance`.
- **Language Boundaries & Fallbacks:**
  - **English (`en-IN` / `en-US`):** Full end-to-end support for live speech recognition and voice synthesis.
  - **Hindi (`hi-IN`):** Full dual-mode support utilizing Devanagari script pattern matching and Hinglish transliteration detection. If speech recognition yields Romanized Hindi (e.g., *"dawa kab leni hai"*), internal regex engines recognize phonemes and map intents accurately.
  - **Regional Indian Languages (Bengali, Tamil, Marathi, Telugu, etc.):** Because client browser Web Speech engines depend strictly on the underlying host OS (Windows SAPI, macOS Speech, or Android TTS voices), regional voice synthesis availability cannot be universally guaranteed across client hardware. Where an OS voice pack is absent, the application gracefully degrades to visual on-screen text transcripts and localized conversational cards.

---

## 3. SYSTEM ARCHITECTURE

```
+---------------------------------------------------------------------------------------+
|                                  CLIENT WEB BROWSERS                                  |
+---------------------------------------------------------------------------------------+
      | (Port 5174)         | (Port 5175)        | (Port 5177)      | (Port 5178)     | (Port 5179)
      v                     v                    v                  v                 v
+-------------+       +-------------+      +------------+     +------------+    +---------------+
|  authpage   |       |  homepage   |      | Neuromusic |     | Neurogames |    | caregiverpage |
| (Auth/Role) |       | (Companion) |      |  (Player)  |     | (Cognitive)|    | (Hub/Charts)  |
+-------------+       +-------------+      +------------+     +------------+    +---------------+
      |                      |                   |                  |                   |
      | Session Params       | Voice & Routine   | Polling Commands | Game Results      | Overview & Links
      |                      |                   |                  |                   |
      +----------------------+-------------------+------------------+-------------------+
                                                 |
                                     HTTP REST / JSON Requests
                                                 v
                               +-----------------------------------+
                               |     NEURONOVAI BACKEND SERVICE    |
                               |          (Port 5001)              |
                               +-----------------------------------+
                               | • Express 5 REST Routing          |
                               | • Intent Classifier & State Engine|
                               | • Deterministic Stats Engine      |
                               | • Memory Command Queue            |
                               | • YouTube Content Safety Pipeline |
                               +-----------------------------------+
                                       |                    |
                         Internal API Calls       Prepared SQL Queries
                                       |                    |
                                       v                    v
                       +----------------------+    +--------------------+
                       | THIRD-PARTY SERVICES |    | PERSISTENT STORAGE |
                       | • OpenRouter AI LLM  |    | • SQLite Database  |
                       | • YouTube Data API v3|    |   (`neuronova.db`) |
                       +----------------------+    +--------------------+
```

### 3.1 Service Responsibilities & Domain Boundaries
1. **`Neuronovai` (Backend Service, Port 5001):**
   Acts as the central orchestrator and single source of truth. Handles SQLite persistence, executes statistical window aggregations, sanitizes third-party YouTube queries, enforces authorization checks between patients and caregivers, and houses the cross-origin player command store.
2. **`authpage` (Authentication Gateway, Port 5174):**
   Handles identity lifecycle (email/password sign-up, sign-in, guest access) via Firebase Auth. Directs users to their dedicated destination micro-frontend based on selected role (`patient` → `homepage`, `caregiver` → `caregiverpage`).
3. **`homepage` (Patient Daily Companion, Port 5175):**
   The primary patient interface. Provides temporal orientation, daily routine progress tracking, medication checklists, accessibility preferences (font scaling, high-contrast mode), and the floating hands-free Voice Companion.
4. **`Neuromusic` (Formative Music Therapy, Port 5177):**
   A specialized ambient audio player designed with high contrast, calm motion, and zero cognitive friction. Incorporates formative-era decade presets (1960s–1980s), automated contextual queue generation, continuous playback loop, and volume ducking.
5. **`Neurogames` (Cognitive Training Suite, Port 5178):**
   Houses four targeted cognitive training modules:
   - *Memory Match:* Visual paired association.
   - *Sequence Recall:* Sequential working memory utilizing a fixed 3x3 colored light-up array.
   - *Focused Attention:* Distractor inhibition and rapid target detection.
   - *Cultural Heritage Recall:* Autobiographical and historical associative quizzes.
   - *Family Memory Vault:* Structured memory bank for familiar faces and voices.
6. **`caregiverpage` (Caregiver Oversight Hub, Port 5179):**
   Empowers family caregivers and clinicians with longitudinal performance metrics: interactive daily activity charts, step combination records, routine completion percentages, full voice companion interaction histories, and AI-synthesized narrative reflections.

### 3.2 Cross-Origin Communication: The Command-Queue Pattern
Because each micro-frontend operates on an independent origin (e.g., ports 5175, 5177, 5179 in development, or separate subdomains/paths in production), client browsers enforce strict Cross-Origin isolation. Direct DOM access, iframe scripting, and shared `window.postMessage` channels are either blocked or fragile across separate browser tabs.

To enable the Voice Assistant on `homepage` to control music playback on `Neuromusic` without coupling their frontends:
1. When a user tells the Voice Assistant: *"Play peaceful sitar music"* or *"Pause the music"*, `homepage` dispatches an HTTP POST to `http://localhost:5001/api/player/command` containing the patient ID, command action (`PLAY_TRACK`, `PLAY_GENERAL`, `PAUSE`, `RESUME`), and metadata.
2. The backend stores this command in an in-memory ring store (`playerCommandStore.ts`) mapped by `patientId` (with fallback aliases for `guest_user` and `default-patient`) along with an epoch timestamp.
3. `Neuromusic` executes an ongoing background poll (`GET /api/player/command?patientId=...&since=...`) every 2,500ms.
4. Upon detecting a command timestamped after its last processed epoch, `Neuromusic` executes the native player method (`player.pauseVideo()`, `player.playVideo()`, or loads a new video queue), updates its playback UI, and acknowledges the state change.
5. Commands older than 90 seconds are automatically dropped by the backend to prevent stale replays.

### 3.3 Deployment Topology & Environment Configuration
In production environments:
- **Frontends:** Deployed as static SPA builds to Vercel (or static edge CDNs).
- **Backend:** Hosted on a Node.js containerized environment (e.g., Render, Railway, or AWS ECS) with persistent disk mounting for `neuronova.db`.
- **Environment URLs:** All frontends reference the backend using configurable environment variables (`VITE_BACKEND_URL`, defaulting to `http://localhost:5001` in development). The backend enforces origin validation using `ALLOWED_ORIGINS` to permit production domains alongside local development ports.

---

## 4. DATABASE SCHEMA

The localized SQLite database (`neuronova.db`) is structured with nine primary tables and indexed foreign lookups.

```
+------------------------+          +------------------------------+
|         users          |          |   patient_caregiver_links    |
+------------------------+          +------------------------------+
| id (PK)                |<----+    | id (PK, AutoInc)             |
| name                   |     +---| patient_id (FK -> users.id)  |
| email_or_phone         |     +---| caregiver_id (FK -> users.id)|
| role                   |     |    | relationship                 |
| created_at             |     |    | status                       |
| last_login             |     |    | requested_by                 |
+------------------------+     |    | created_at                   |
                               |    | approved_at                  |
                               |    +------------------------------+
                               |
                               |    +------------------------------+
                               |    |    patient_invite_codes      |
                               |    +------------------------------+
                               +---| patient_id (PK, FK->users.id)|
                               |    | invite_code (UNIQUE)         |
                               |    | created_at                   |
                               |    +------------------------------+
                               |
                               |    +------------------------------+
                               |    |         game_results         |
                               |    +------------------------------+
                               +---| user_id (FK -> users.id)     |
                               |    | game_type                    |
                               |    | level                        |
                               |    | accuracy                     |
                               |    | response_time_ms             |
                               |    | attempts                     |
                               |    | combinations_reached         |
                               |    | timestamp                    |
                               |    | created_at                   |
                               |    +------------------------------+
                               |
                               |    +------------------------------+
                               |    |         routine_logs         |
                               |    +------------------------------+
                               +---| user_id (FK -> users.id)     |
                               |    | routine_id                   |
                               |    | title                        |
                               |    | completed                    |
                               |    | scheduled_time               |
                               |    | date                         |
                               |    | completed_at                 |
                               |    +------------------------------+
                               |
                               |    +------------------------------+
                               |    |    voice_assistant_logs      |
                               |    +------------------------------+
                               +---| user_id (FK -> users.id)     |
                               |    | user_name                    |
                               |    | raw_question                 |
                               |    | translated_question          |
                               |    | detected_language            |
                               |    | intent                       |
                               |    | reply_text                   |
                               |    | spoken_reply                 |
                               |    | action_label                 |
                               |    | action_url                   |
                               |    | action_icon                  |
                               |    | song_name                    |
                               |    | source                       |
                               |    | created_at                   |
                               |    +------------------------------+
                               |
                               |    +------------------------------+
                               |    |   music_listening_history    |
                               |    +------------------------------+
                               +---| user_id (FK -> users.id)     |
                               |    | song_id                      |
                               |    | title                        |
                               |    | artist                       |
                               |    | duration_seconds             |
                               |    | played_at                    |
                               |    | play_count                   |
                               |    +------------------------------+
                               |
                               |    +------------------------------+
                               |    |         liked_songs          |
                               |    +------------------------------+
                               +---| user_id (FK -> users.id)     |
                                    | song_id                      |
                                    | title                        |
                                    | artist                       |
                                    | created_at                   |
                                    +------------------------------+
```

### 4.1 Table Definitions & DDL

#### 1. `users`
Tracks identity, profile metadata, role designation, and audit timestamps.
```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email_or_phone TEXT,
  role TEXT DEFAULT 'patient',
  created_at TEXT DEFAULT (datetime('now')),
  last_login TEXT
);
```

#### 2. `patient_caregiver_links`
Stores many-to-many relationships and authorization scopes between patients and caregivers.
```sql
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
CREATE INDEX IF NOT EXISTS idx_links_caregiver ON patient_caregiver_links(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_links_patient ON patient_caregiver_links(patient_id);
```

#### 3. `patient_invite_codes`
Maintains secure, human-readable 6-character linking codes generated by patients to authenticate family caregivers.
```sql
CREATE TABLE IF NOT EXISTS patient_invite_codes (
  patient_id TEXT PRIMARY KEY,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_invite_code ON patient_invite_codes(invite_code);
```

#### 4. `game_results`
Stores fine-grained performance telemetry from every completed cognitive mini-game session.
```sql
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
CREATE INDEX IF NOT EXISTS idx_games_user ON game_results(user_id);
```

#### 5. `routine_logs`
Records patient checklist interactions, daily completion flags, and medication timing.
```sql
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
CREATE INDEX IF NOT EXISTS idx_routine_user_date ON routine_logs(user_id, date);
```

#### 6. `music_listening_history`
Tracks longitudinal audio therapy engagement, duration, and replay counts.
```sql
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
CREATE INDEX IF NOT EXISTS idx_history_user ON music_listening_history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_play_count ON music_listening_history(user_id, play_count DESC);
```

#### 7. `liked_songs`
Stores favorite tracks bookmarked by the patient for rapid therapeutic playback.
```sql
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
CREATE INDEX IF NOT EXISTS idx_liked_user ON liked_songs(user_id);
```

#### 8. `user_playlists`
Stores custom audio groupings (e.g., *"Morning Sitar"*, *"Dada's Favorites"*).
```sql
CREATE TABLE IF NOT EXISTS user_playlists (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  tracks_json TEXT,
  created_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_playlists_user ON user_playlists(user_id);
```

#### 9. `voice_assistant_logs`
Provides full audit transparency for caregiver oversight by recording spoken questions, detected language, classified intents, generated responses, and invoked actions.
```sql
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
```

---

## 5. METHODOLOGY & DEVELOPMENT APPROACH

### 5.1 Iterative, Single-Domain Lifecycle
Early iterations revealed that attempting to build and integrate all six services simultaneously caused configuration drift, broken cross-origin sessions, and uncontrolled debugging scope. To ensure stability, the project adopted an **isolated, single-section-at-a-time methodology**:
1. **Phase 1: Authentication & Role Gateway (`authpage`):** Implemented Firebase authentication, session token scoping, and deterministic URL parameter handoffs to subsequent services.
2. **Phase 2: Patient Daily Companion (`homepage`):** Developed high-contrast orientation components, daily routine checklist logic, and persistent localStorage/backend synchronization.
3. **Phase 3: Cognitive Stimulation Suite (`Neurogames`):** Built isolated game engines with standardized score contracts (`GameResult`) and tested resilience against rapid accidental tapping.
4. **Phase 4: Formative Audio Therapy (`Neuromusic`):** Constructed the YouTube IFrame player shell, integrated decade presets, and implemented the multi-layer safety filtering pipeline.
5. **Phase 5: Caregiver Oversight Hub (`caregiverpage`):** Developed patient link authorization, data aggregation engines, and native SVG analytics visualizations.
6. **Phase 6: Central AI & Telemetry Integration (`Neuronovai`):** Centralized statistical computation, connected OpenRouter LLM narrative generation, implemented the cross-origin command queue, and unified all endpoints.

### 5.2 Verification & Testing Strategy
- **Automated Type & Build Verification:** Each micro-frontend enforces TypeScript type safety before bundling (`tsc && vite build`).
- **Backend Isolation Testing:** Standalone Node test scripts (such as `Neuronovai/scratch_test_isolation.js`) were executed against real database instances to verify SQL constraints, unique indexes, and error propagation under edge cases.
- **Cross-Service End-to-End Testing:** Verification of end-to-end user flows across physical browser instances, confirming that voice inputs on Port 5175 accurately manipulate audio states on Port 5177 while reflecting logs on Port 5179.

---

## 6. KEY SYSTEM FLOWS

### 6.1 Flow A: User Authentication & Role-Based Routing
```
[User on Auth Portal (:5174)]
         |
         v
[Submits Email/Password or Selects Guest]
         |
         v
[Firebase Auth Authenticates / Issues Token]
         |
         v
[Role Evaluated in AuthContext]
         |
         +---> Role == 'patient'
         |        |
         |        v
         |     [Extract Patient Name & UserID]
         |        |
         |        v
         |     [Redirect to http://localhost:5175/?userId=...&name=...&role=patient]
         |
         +---> Role == 'caregiver'
         |        |
         |        v
         |     [Extract Caregiver Name & UserID]
         |        |
         |        v
         |     [Redirect to http://localhost:5179/?userId=...&name=...&role=caregiver]
         |
         +---> Role == 'asha' OR 'admin'
                  |
                  v
               [Render In-Portal Dedicated Healthcare Role Preview]
```
1. The user lands on `authpage` (`http://localhost:5174`).
2. The user initiates sign-in or sign-up via `LoginModal` or `SignupModal`, supplying credentials and selecting an active persona (`patient`, `caregiver`, `asha`, `admin`).
3. Firebase Client Auth authenticates the user, returning a user credential object (`uid`, `email`, `displayName`).
4. `authpage` persists this identity to `localStorage` under `neuronova_auth_session` and calls `POST /api/user/sync-session` on `Neuronovai` to ensure the user row exists in SQLite.
5. `handleTransitionComplete` evaluates the active role:
   - If `patient`: The window redirects to `http://localhost:5175/?userId=${uid}&name=${name}&role=patient`.
   - If `caregiver`: The window redirects to `http://localhost:5179/?userId=${uid}&name=${name}&role=caregiver`.
   - If `asha` or `admin`: The user is retained on `authpage` where `RolePortalPlaceholder` presents the dedicated administrative workspace.

---

### 6.2 Flow B: Patient-Caregiver Linking via Invite Code
```
[Patient on Homepage (:5175)]                [Caregiver on Caregiver Hub (:5179)]
            |                                                 |
            v                                                 v
[Opens Accessibility / Pairing Modal]             [Clicks "Connect New Patient"]
            |                                                 |
            v                                                 v
[GET /api/patient/:id/invite-code]                [Enters 6-Character Invite Code]
            |                                                 |
            v                                                 v
[Backend Generates Code: "NEURO-8F2A1C"]          [POST /api/caregiver/link]
            |                                                 |
            +-------------------- Verbal/Visual ------------->+
                                                              |
                                                              v
                                              [Backend Validates Code & Identity]
                                                              |
                                                              v
                                              [Inserts Row into patient_caregiver_links]
                                                              |
                                                              v
                                              [Caregiver Dashboard Auto-Selects Patient]
                                                              |
                                                              v
                                              [GET /api/caregiver/:cId/patient/:pId/overview]
                                                              |
                                                              v
                                              [verifyActiveLink Enforces Access Control]
                                                              |
                                                              v
                                              [Authorized Overview Data Rendered]
```
1. **Invite Code Generation:** A patient on `homepage` opens the Pairing dialog. The frontend calls `GET /api/patient/:patientId/invite-code`. The backend checks `patient_invite_codes`. If no code exists, it generates a unique 6-character cryptographic string (e.g., `8F2A1C`), saves it to SQLite, and returns it.
2. **Caregiver Submission:** The family caregiver on `caregiverpage` opens `LinkPatientModal` and enters the patient's invite code along with their relationship (e.g., *"Daughter"*, *"Primary Caregiver"*).
3. **Backend Authorization Verification:**
   - The backend looks up `invite_code` in `patient_invite_codes`. If not found, it responds with `404 Invalid invite code`.
   - If found, it extracts `patient_id`. It verifies that the caregiver is not attempting to link to themselves.
   - It performs an `INSERT INTO patient_caregiver_links` with `status = 'active'`.
4. **Access Enforcement:** Subsequent requests from the caregiver to inspect patient data (`/api/caregiver/:caregiverId/patient/:patientId/overview`) pass through `verifyActiveLink(caregiverId, patientId)`. The backend queries `patient_caregiver_links` for an active link row; if missing or revoked, it halts execution and returns `403 Forbidden`.

---

### 6.3 Flow C: Voice Companion Intent Classification & Command Routing
```
[User Speaks into Homepage Mic]
               |
               v
[Web Speech STT: Audio -> Text Transcript]
               |
               v
[POST /api/voice-assistant]
   { userId, rawQuestion, language, routineSchedule }
               |
               v
[Intent Classifier Engine (intentClassifier.ts)]
               |
  +------------+------------+--------------------+-------------------+
  |                         |                    |                   |
  v                         v                    v                   v
[play_specific_song]   [play_general_music]  [routine_inquiry]   [open_ended]
  |                         |                    |                   |
  v                         v                    v                   v
[Search YouTube]       [Fetch Ambient Raga]  [Parse Checklist]   [Prompt OpenRouter LLM]
  |                         |                    |                   |
  +------------+------------+                    |                   |
               |                                 |                   |
               v                                 |                   |
[Dispatch to playerCommandStore]                 |                   |
               |                                 |                   |
               v                                 v                   v
   +-----------------------+           +---------------------------------+
   | Neuromusic Polls &    |           | Synthesize Compassionate Audio  |
   | Executes Playback     |           | Speech & Render Card on Screen  |
   +-----------------------+           +---------------------------------+
```
1. The patient activates the microphone on `homepage`. The Web Speech API transcribes audio into a text query.
2. `homepage` posts `{ userId, userName, message, language, routine }` to `POST /api/voice-assistant`.
3. `intentClassifier.ts` parses the text through priority regex patterns across both English and Hindi:
   - **`play_specific_song`:** Extracted when user specifies an artist, bhajan, or song title (e.g., *"play lag ja gale"* or *"किशोर कुमार का गाना बजाओ"*). Action: Executes YouTube search via safety pipeline, dispatches `PLAY_TRACK` to `playerCommandStore`, logs transcript, and returns a direct audio confirmation.
   - **`play_general_music`:** Extracted on generic music requests (e.g., *"play some peaceful music"*, *"शांतिदायक संगीत चलाओ"*). Action: Selects a formative sitar/flute meditation track, dispatches `PLAY_GENERAL` to `playerCommandStore`, and responds soothingly.
   - **`pause_music` / **`resume_music`:** Dispatches `PAUSE` or `RESUME` to `playerCommandStore`.
   - **`routine_inquiry`:** Evaluates current time against `routineSchedule` in SQLite. Computes pending tasks and upcoming medicines, formulating a clear verbal response (e.g., *"Your afternoon blood pressure medicine is scheduled at 2:00 PM with warm water."*).
   - **`date_time_inquiry`:** Formulates an orientation statement detailing the current day of the week, full date, and time.
   - **`open_ended`:** Prompts the OpenRouter LLM (`generateVoiceCompanionResponse`) with a strict patient-protection system prompt, generating a warm, reassuring response of no more than 2 sentences.
4. If an audio action was triggered, `Neuromusic` receives the command on its subsequent 2.5-second polling interval and transitions playback immediately.

---

### 6.4 Flow D: Music Search & Safety Filtering Pipeline
```
[Search Query Received: e.g. "old hindi classical songs"]
                          |
                          v
[Step 1: Category Filtering & Query Enrichment]
(Appends formative safety tokens: "classic original authentic audio")
                          |
                          v
[Step 2: YouTube Data API v3 Query Execution]
(Fetches up to 15 candidates with snippet metadata)
                          |
                          v
[Step 3: Duration Ceiling & Floor Check]
  • If duration < 60 seconds (Shorts detection) -> REJECT
  • If duration > 1,200 seconds (Full movie / Mega-compilation) -> REJECT
                          |
                          v
[Step 4: Title & Marker Exclusion Analysis]
  • Contains "full movie", "teaser", "trailer", "scene"? -> REJECT
  • Contains "remix", "8D audio", "slowed reverb", "bass boosted"? -> REJECT
                          |
                          v
[Step 5: Explicit Content & Channel Blocklist Check]
  • Channel matches BLOCKED_CHANNEL_PATTERNS (e.g. sxybit, erotic)? -> REJECT & AUDIT LOG
  • Title/Description matches EXPLICIT_CONTENT_TERMS? -> REJECT & AUDIT LOG
                          |
                          v
[Step 6: Authentic Label & Channel Awareness Scoring]
  • Priority boost for verified labels (Saregama, T-Series, Zee Music, VEVO)
  • Priority boost for dedicated archive channels
                          |
                          v
[Output: Curated CleanTrack[] Array Delivered to Player]
```
1. **Query Enrichment:** Input queries are enriched with safety filters (e.g., suppressing modern live concerts and amateur bedroom covers).
2. **API Search:** Fetches candidate video objects via YouTube Data API v3.
3. **Shorts & Feature-Length Filtering:** Detailed video durations are parsed from ISO 8601 strings (`PT...`). Tracks under 60 seconds are discarded to eliminate rapid-fire YouTube Shorts. Tracks over 20 minutes are discarded to prevent accidental full-length Bollywood films from playing.
4. **Keyword Exclusion:** Strict regex rejects titles containing *"full movie"*, *"trailer"*, *"teaser"*, *"remix"*, *"8D audio"*, *"slowed reverb"*, or *"karaoke"*.
5. **Explicit Safety Blocklist:** Content is cross-referenced against `BLOCKED_CHANNEL_PATTERNS` and `EXPLICIT_CONTENT_TERMS`. Any offending video is blocked and permanently recorded in `logs/search_safety.log` for audit review.
6. **Label Prioritization:** Verified record archives (e.g., Saregama, Universal Music India) receive priority ranking, ensuring clean master recordings are delivered to the patient.

---

### 6.5 Flow E: AI-Curated Cognitive Progress Summary Generation
```
[Caregiver / System Requests Progress Summary]
                       |
                       v
[Step 1: Deterministic Statistical Aggregation (statsEngine.ts)]
  • Computes window metrics across 4 dimensions:
    - Visual Memory Accuracy & Trend
    - Attention & Distractor Suppression Time
    - Working Memory & Maximum Sequence Steps Reached
    - Cultural & Associative Recall
  • Computes Routine Adherence Rate (% medicines & tasks completed)
  • Calculates absolute change metrics (% change vs. prior period)
                       |
                       v
[Step 2: Memory Cache Lookup (cache.ts)]
  • Constructs key: `summary_${patientId}_${windowDays}_${latestGameTimestamp}`
  • Cache Hit? -> Return Cached JSON immediately
                       |
                       v
[Step 3: LLM Narrative Synthesis (openrouterClient.ts)]
  • Prompts OpenRouter (GLM 5.2 / configured model) with:
    - Exact numerical stats from Step 1 (NO hallucinated metrics allowed)
    - Patient name and formative cultural background
  • Enforces JSON Schema:
    {
      status: "steady" | "improving" | "needs_attention",
      summary: string,
      combinationInsight: string,
      musicInsight: string,
      recommendations: string[]
    }
                       |
       +---------------+---------------+
       |                               |
  (API Success)                   (API Failure / Timeout)
       |                               |
       v                               v
[Step 4a: Store in Cache]      [Step 4b: Rule-Based Fallback Synthesis]
       |                               |
       +---------------+---------------+
                       |
                       v
[Delivered to Caregiver Overview Dashboard]
```
1. **Deterministic Metrics Extraction:** The backend runs `computeCognitiveStats` on all patient game results and routine logs over the selected evaluation window (default 7 days). This statistical engine computes exact averages, baseline comparisons, and percentage shifts deterministically without touching an AI model.
2. **Cache Verification:** `cache.ts` checks if a summary has already been computed for this exact statistical state.
3. **Structured Prompting:** If not cached, the structured metrics are passed into OpenRouter (`z-ai/glm-5.2:free` or specified LLM) with instructions to synthesize an empathetic clinical narrative for the family. The prompt strictly instructs the model not to calculate new numbers, only to explain the deterministic data provided.
4. **Fallback Resilience:** If OpenRouter times out, exceeds rate limits, or returns invalid JSON, `generateFallbackSummary` intercepts the request. It constructs a complete, clinically sound narrative report using rule-based templates based directly on the deterministic stats, ensuring the caregiver dashboard never fails to load.

---

### 6.6 Flow F: Cognitive Game Telemetry & Progress Computation
```
[Patient Completes Game Session in Neurogames (:5178)]
                         |
                         v
[Game Engine Computes Score Contract]
  {
    gameType: 'sequenceRecall',
    level: 6,
    accuracy: 100,
    responseTimeMs: 840,
    attempts: 1,
    combinationsReached: 6,
    timestamp: "2026-09-07T11:20:00.000Z"
  }
                         |
                         v
[Step 1: Scoped Local Backup (gamePersistence.ts)]
  • Updates localStorage under `neuronova_game_history_${userId}`
                         |
                         v
[Step 2: Central Backend Dispatch]
  • POST http://localhost:5001/api/user/:userId/games/results
                         |
                         v
[Step 3: SQLite Storage]
  • Inserts into `game_results` table with foreign key linkage
                         |
                         v
[Step 4: Caregiver Dashboard Analytics Update]
  • Caregiver Hub reflects updated combinations, accuracy, and play time
```
1. A patient completes a session of any mini-game (e.g., reaching 6 light-up steps in *Sequence Recall*).
2. The game component packages a standardized `GameResult` object containing `gameType`, `level`, `accuracy`, `responseTimeMs`, `attempts`, `combinationsReached`, and an ISO timestamp.
3. `persistGameResult` in `gamePersistence.ts` immediately writes a copy to a scoped localStorage key (`neuronova_game_history_${userId}`) to safeguard against intermittent network interruptions.
4. `persistGameResult` dispatches an HTTP POST to `http://localhost:5001/api/user/${userId}/games/results`.
5. The backend inserts the record into `game_results`.
6. When the Caregiver Hub loads, these rows are aggregated to compute total cognitive play time, highest combinations reached, and accuracy trends across longitudinal graphs.

---

## 7. SECURITY MODEL

### 7.1 Server-Side Secret Isolation
All sensitive API keys and provider tokens are strictly restricted to backend server environments:
- **`OPENROUTER_API_KEY`:** Stored exclusively in `Neuronovai/.env`. Never exposed to client bundles or browser network tabs.
- **`YOUTUBE_API_KEY`:** Stored exclusively in `Neuronovai/.env`. All client music queries proxy through the backend endpoints (`/api/music/search`, `/api/youtube/details`).
- **Client Configuration:** Only non-sensitive identifiers (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`) exist in frontend `.env.local` files, protected by Firebase domain authorization rules.

### 7.2 Patient-Caregiver Data Scoping & Access Control
Access to private patient telemetry is strictly gated:
1. **Scoped Storage Keys:** Client-side caches use user-specific keys (`neuronova_game_history_${userId}`) to prevent data leakage between different users on shared tablets or household computers.
2. **Backend Authorization Gate (`verifyActiveLink`):** Any caregiver request attempting to fetch patient vitals, routines, or voice histories must supply their `caregiverId` and the target `patientId`. The backend explicitly verifies an active row in `patient_caregiver_links` before returning any telemetry. Unauthorized requests are rejected with `403 Forbidden`.

### 7.3 CORS Defense & Origin Whitelisting
Cross-Origin Resource Sharing is controlled via Express CORS middleware. Only approved development origins (`http://localhost:5173` through `5179`) and explicitly configured production domains listed in the `ALLOWED_ORIGINS` environment variable are permitted to execute API calls.

---

## 8. KNOWN LIMITATIONS

In adherence to technical honesty, the following constraints and operational boundaries currently exist in the NeuroNova implementation:

1. **Third-Party YouTube Advertising:**
   Because audio playback relies on the official client-side YouTube IFrame Player API (`window.YT`), client-side pre-roll and mid-roll advertisements served by Google cannot be programmatically blocked without violating YouTube’s Terms of Service or attempting brittle DOM frame injection. NeuroNova mitigates this by applying audio ducking, filtering for official label uploads with lower ad density, and providing visual status indicators, but occasional ads will still be rendered by YouTube.
2. **Client-Side Voice Synthesis Disparities:**
   Web Speech API text-to-speech synthesis relies entirely on voices pre-installed in the user's browser and operating system. While Hindi (`hi-IN`) and Indian English (`en-IN`) are widely supported on modern Android, Windows, and macOS devices, regional language voice synthesis (e.g., Gujarati, Tamil, Kannada) depends on specific OS voice packs. When missing, the platform relies on written visual cards.
3. **SMS Notifications Status:**
   Caregiver medication alerts and streak notifications are implemented as in-app dashboard alerts, audio chimes, and browser notifications. Integration with an external SMS gateway (such as Twilio or AWS SNS) is currently simulated and not connected to active cellular telecommunication channels.
4. **Cross-Tab Audio Isolation:**
   When the Voice Assistant on `homepage` triggers music on `Neuromusic`, communication occurs via the backend command-polling mechanism (latency: 0.5s–2.5s). If the `Neuromusic` tab has been closed or put into deep sleep by browser memory-saver settings, the audio player cannot execute playback until the tab is reopened or focused.
5. **ASHA Worker & Admin Portals:**
   The primary implemented workflows focus on the Patient Companion and Caregiver Oversight Hub. The Community Healthcare Worker (ASHA) and Administrator portals currently exist as architectural prototypes with interface placeholders.

---
*NeuroNova Technical Design Document • Maintained by the NeuroNova Development Team*
