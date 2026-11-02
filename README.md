# NeuroNova 🧠🌸

> **AI-Powered Cognitive Care, Music Therapy & Dementia Companion Platform**

NeuroNova is a full-stack, real-time elder care ecosystem designed for patients living with cognitive decline and dementia, their family caregivers, and community healthcare workers. It combines structured cognitive training, AI-curated nostalgia music therapy, multilingual voice assistance, live caregiver monitoring, and WebRTC voice calling — all consolidated into a single unified fullstack project.

[![Made with React](https://img.shields.io/badge/Frontend-React%2019%20+%20TypeScript-61DAFB?logo=react)](https://reactjs.org/)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20+%20Express-339933?logo=nodedotjs)](https://nodejs.org/)
[![AI](https://img.shields.io/badge/AI-OpenRouter%20%7C%20Gemma%2031B-FF6B35)](https://openrouter.ai/)
[![Realtime](https://img.shields.io/badge/Realtime-Socket.io%20%7C%20WebRTC-010101?logo=socketdotio)](https://socket.io/)
[![DB](https://img.shields.io/badge/Database-SQLite%20(better--sqlite3)-003B57?logo=sqlite)](https://www.sqlite.org/)

---

## ✨ Unified Architecture & Structure

```
Neuronova/
├── frontend/               # Unified Single-Page Application (React 19, Tailwind, Vite)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/       # Landing page & Firebase Role Authentication
│   │   │   ├── patient/    # Patient Daily Companion, Routine & Voice Assistant
│   │   │   ├── caregiver/  # Caregiver Command Hub, Analytics & Voice Inbox
│   │   │   ├── music/      # Nostalgia Music Therapy & Mood Player (Neuromusic)
│   │   │   ├── games/      # Cognitive Training Games Suite (Neurogames)
│   │   │   └── healthworker/# Community Healthcare Worker / ASHA Portal
│   │   ├── shared/         # Shared API & Client Navigation Configuration
│   │   ├── App.tsx         # Central React Router
│   │   └── index.css       # Unified Tailwind design system & animations
│   ├── package.json
│   └── vite.config.ts      # Proxies /api & /socket.io directly to backend
│
├── backend/                # Express, SQLite, Socket.io, WebRTC Signaling & AI
│   ├── src/
│   │   ├── server.ts       # Unified API & Socket Server
│   │   ├── intentClassifier.ts
│   │   ├── openrouterClient.ts
│   │   ├── youtubeClient.ts
│   │   └── db.ts
│   └── package.json
│
├── package.json            # Root workspace — run entire project with single command
├── start-all.bat           # 1-click launcher for Windows
└── start-all.ps1           # 1-click PowerShell launcher
```

---

## 🚀 Quick Start

### 1. Start Both Services (Single Command)
From the root folder:
```bash
npm run dev
```
- **Frontend App**: [http://localhost:5173/](http://localhost:5173/)
- **Backend API & WebSockets**: [http://localhost:5001/](http://localhost:5001/)

Or double-click `start-all.bat` (or run `start-all.ps1`).

---

## 🗺️ Client Routes (Seamless Navigation)

All modules run under the same origin — no more hardcoded `localhost:517X` redirect loops!

| Route | Feature |
| :--- | :--- |
| **`/`** | Landing page & Role Login / Sign-up |
| **`/patient`** | Patient Home — Routine, Streak, Multilingual Voice Companion |
| **`/caregiver`** | Caregiver Hub — Analytics, Notifications, Voice Notes, Medical Vault |
| **`/music`** | Nostalgia Music Therapy & Mood Session Player |
| **`/games`** | Cognitive Training Games (Memory Match, Sequence, Attention) |
| **`/healthworker`** | Community Healthcare Worker / ASHA Portal |

---

## 🌐 Mobile, Wi-Fi & Production Deployment

Because all internal paths are now relative client routes and the backend supports cross-device CORS:
1. **Testing on Mobile on Local Wi-Fi**: Simply open `http://<YOUR_LOCAL_IP>:5173/` (e.g. `http://192.168.0.161:5173/`) on your phone or tablet. All pages, audio, games, and caregiver tools work seamlessly.
2. **Production Deployment**:
   - **Frontend**: Deploy `frontend/` to Vercel, Netlify, or Cloudflare Pages with `VITE_BACKEND_URL=https://your-api.com`.
   - **Backend**: Deploy `backend/` to Render, Railway, Fly.io, or VPS.
