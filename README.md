# NeuroNova 🧠🌸

> **AI-Powered Cognitive Care, Music Therapy & Dementia Companion Platform**

NeuroNova is a full-stack, real-time elder care ecosystem designed for patients living with cognitive decline and dementia, their family caregivers, and community healthcare workers. It combines structured cognitive training, AI-curated nostalgia music therapy, multilingual voice assistance, live caregiver monitoring, and WebRTC voice calling — all optimised for senior-friendly accessibility.

[![Made with React](https://img.shields.io/badge/Frontend-React%20+%20TypeScript-61DAFB?logo=react)](https://reactjs.org/)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20+%20Express-339933?logo=nodedotjs)](https://nodejs.org/)
[![AI](https://img.shields.io/badge/AI-OpenRouter%20%7C%20Gemma%2031B-FF6B35)](https://openrouter.ai/)
[![Realtime](https://img.shields.io/badge/Realtime-Socket.io%20%7C%20WebRTC-010101?logo=socketdotio)](https://socket.io/)
[![DB](https://img.shields.io/badge/Database-SQLite%20(better--sqlite3)-003B57?logo=sqlite)](https://www.sqlite.org/)

---

## ✨ Key Features

### 🎙️ Multilingual AI Voice Companion
- Supports **Hindi**, **Hinglish**, and **English** — switchable live
- Intent classification: medicine reminders, weather, games, music, caregiver calls, storytelling
- Hands-free **speech-to-text** (Web Speech API) + **text-to-speech** responses
- Voice history synced to Caregiver Dashboard in real-time
- Language propagation across the entire UI (homepage tiles, routine labels, assistant prompts)

### 📞 Real-Time WebRTC Caregiver Calling
- Patient → Caregiver live audio calls via WebRTC + Socket.io signalling
- **Incoming call modal** on Caregiver Dashboard with Accept / Decline
- **Melodic ringtones** synthesised with Web Audio API (4-note ascending on patient, descending on caregiver)
- Ringtone stops automatically on connect, decline, or no-answer timeout
- Emergency contact fallback shown when caregiver is unreachable

### 🎵 AI Music Therapy (Neuromusic)
- YouTube-sourced nostalgia music curated to the patient's formative era (1950s–1980s Bollywood, classical, folk)
- AI-powered song recommendations based on mood, language, and listening history
- Like / Dislike / Repeat controls with SQLite persistence
- Caregiver can view full listening history, liked songs, and search history

### 🧩 Cognitive Training Suite (Neurogames)
- **Memory Match** — card-flip concentration game
- **Sequence Recall** — pattern memory and digit span
- **Attention Training** — focus and reaction exercises
- **Cultural Recall** — Indian proverbs and old film trivia
- Post-game completion sync to backend; caregiver sees accuracy trends and streaks

### 📋 Daily Routine & Medication Tracker
- Caregiver-created tasks visible on Patient Homepage
- Real-time two-way sync: Patient completion → Caregiver dashboard update (Socket.io)
- Streak tracking and progress rings on patient home

### 🏥 Caregiver Command Hub
- Linked patient management with strict access control
- Live **Voice Interaction Timeline** — real conversations pulled from DB, not mock data
- **Brain game analytics** with accuracy breakdown by game type
- **Voice message inbox** — patients send audio recordings, caregiver plays them
- **Health Worker access requests** — accept / reject with real-time notifications
- **AI Cognitive Synthesis** — Gemma 31B powered narrative summary of patient health trends

### 👩‍⚕️ Health Worker Portal
- ASHA worker / clinician portal
- Send access requests to caregivers for patient monitoring
- Request status updates via real-time socket notifications

---

## 🏗️ Architecture & Project Structure

```
Neuronova/
├── Neuronovai/          # Node.js/Express backend — AI, SQLite, Socket.io, WebRTC signalling
├── authpage/            # Firebase Auth — multi-role login (Patient, Caregiver, ASHA, Admin)
├── homepage/            # Patient Home Companion — Voice Assistant, Routine, Calling
├── caregiverpage/       # Caregiver Dashboard — Analytics, Notifications, Voice Inbox
├── Neuromusic/          # AI Music Therapy Player
├── Neurogames/          # Cognitive Games Suite
├── healthworker/        # Health Worker / ASHA Portal
├── data/                # SQLite databases & audio uploads (gitignored)
├── start-all.bat        # One-click Windows launcher
└── start-all.ps1        # PowerShell launcher
```

| Subproject | Description | Default Port |
| :--- | :--- | :--- |
| **`Neuronovai`** | Express backend — OpenRouter AI, YouTube API, SQLite, Socket.io | `5001` |
| **`authpage`** | Firebase Auth portal — role-based login | `5173` |
| **`homepage`** | Patient Home — Voice companion, routine, calling | `5175` |
| **`Neuromusic`** | Music therapy player | `5177` |
| **`Neurogames`** | Cognitive training games | `5178` |
| **`caregiverpage`** | Caregiver analytics and monitoring hub | `5179` |
| **`healthworker`** | ASHA / clinician access portal | `5180` |

---

## 🔒 Security & Environment Setup

### Key Classification

| Key | Scope | Location | Risk |
| :--- | :--- | :--- | :--- |
| `OPENROUTER_API_KEY` | **SERVER-ONLY** | `Neuronovai/.env` | 🚨 Never expose to browser |
| `YOUTUBE_API_KEY` | **SERVER-ONLY** | `Neuronovai/.env` | 🚨 Never expose to browser |
| `VITE_FIREBASE_*` | **PUBLIC CLIENT** | `authpage/.env.local` | ⚠️ Browser-exposed (secured via Firebase Rules) |

> ⚠️ **CRITICAL**: Never commit `.env` or `.env.local` files. Only `.env.example` templates are committed.

---

### Backend Setup (`Neuronovai`)

```bash
cd Neuronovai
cp .env.example .env
```

Edit `Neuronovai/.env`:
```ini
PORT=5001
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=z-ai/glm-5.2:free
YOUTUBE_API_KEY=your_youtube_data_api_key
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5175,http://localhost:5177,http://localhost:5178,http://localhost:5179,http://localhost:5180
```

---

### Auth Setup (`authpage`)

```bash
cd authpage
cp .env.example .env.local
```

Edit `authpage/.env.local`:
```ini
VITE_FIREBASE_API_KEY=your_firebase_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_web_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

---

### Inter-Service URL Configuration

All service URLs are environment-driven (no hardcoded localhost in source):

| Variable | Target | Local Default |
| :--- | :--- | :--- |
| `VITE_BACKEND_URL` | Neuronovai API | `http://localhost:5001` |
| `VITE_AUTHPAGE_URL` | Auth Portal | `http://localhost:5173` |
| `VITE_HOMEPAGE_URL` | Patient Home | `http://localhost:5175` |
| `VITE_NEUROMUSIC_URL` | Neuromusic | `http://localhost:5177` |
| `VITE_NEUROGAMES_URL` | Neurogames | `http://localhost:5178` |
| `VITE_CAREGIVERPAGE_URL` | Caregiver Hub | `http://localhost:5179` |

---

## 🚀 Running Locally

### Option A: One-Click (Windows)
```cmd
start-all.bat
```
or PowerShell:
```powershell
.\start-all.ps1
```

### Option B: Manual (each in a separate terminal)
```bash
# 1. Backend (Port 5001)
cd Neuronovai && npm run dev

# 2. Auth Page (Port 5173)
cd authpage && npm run dev

# 3. Patient Home (Port 5175)
cd homepage && npm run dev

# 4. Music Player (Port 5177)
cd Neuromusic && npm run dev

# 5. Games Hub (Port 5178)
cd Neurogames && npm run dev

# 6. Caregiver Dashboard (Port 5179)
cd caregiverpage && npm run dev

# 7. Health Worker Portal (Port 5180)
cd healthworker && npm run dev
```

---

## 🧱 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS |
| **Backend** | Node.js + Express + TypeScript |
| **Database** | SQLite via `better-sqlite3` |
| **AI / LLM** | OpenRouter (Gemma 31B, GLM-5.2) |
| **Music** | YouTube Data API v3 |
| **Realtime** | Socket.io (WebSocket) |
| **Calling** | WebRTC + Socket.io signalling |
| **Auth** | Firebase Authentication |
| **Speech** | Web Speech API (STT + TTS) |
| **Audio** | Web Audio API (ringtones, dial tones) |

---

## 🔄 Real-Time Event Architecture

```
Patient Homepage  <──────────────────────────────>  Caregiver Dashboard
     |                    Socket.io                         |
     |  call:invite   ──────────────────────────>  call:incoming (modal)
     |  call:accept   <──────────────────────────  call:accept
     |  WebRTC SDP/ICE <────────────────────────>  WebRTC SDP/ICE
     |                                                       |
     |  task:completed ─────────────────────────>  patient:tasks:updated
     |  voice:message  ─────────────────────────>  caregiver:voice_message:new
     |                                                       |
Health Worker ────── access:request ──────────────>  caregiver:notification:new
```

---

## 🛡️ Pre-Push Security Checklist

- [x] `.env` and `.env.local` are not tracked (`git status`)
- [x] SQLite databases (`Neuronovai/data/*.db`) and logs are in `.gitignore`
- [x] No API keys appear in `git diff --staged`
- [x] Audio uploads (`data/audio/`) are gitignored
- [x] Run `npm run build` on all packages before release

---

## 📄 License & Safety Notice

NeuroNova is an assistive companion tool for elder support and cognitive engagement. It is **not a diagnostic or clinical medical device**. All cognitive exercise, routine adherence, and interaction data is intended solely for family and caregiver awareness and support.

---

<div align="center">
  <sub>Built with ❤️ for elders and their caregivers</sub>
</div>
