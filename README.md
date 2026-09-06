# NeuroNova 🧠🌸

> **Compassionate AI Cognitive Progress, Music Therapy & Dementia Care Companion Platform**

NeuroNova is a specialized care ecosystem designed for elders, patients living with cognitive decline/dementia, family caregivers, and community healthcare workers (ASHA/clinicians). It integrates structured cognitive games, AI-curated formative music therapy, daily routine memory support, and real-time caregiver monitoring.

---

## 🏗️ Architecture & Project Structure

The project consists of specialized micro-frontends and a centralized AI & telemetry backend:

| Subproject | Description | Default Port |
| :--- | :--- | :--- |
| **`Neuronovai`** | Node/Express backend service (OpenRouter AI LLM, YouTube Music API, SQLite persistence) | `http://localhost:5001` |
| **`authpage`** | Authentication portal (Firebase Auth, multi-role selector: Patient, Caregiver, ASHA Worker, Admin) | `http://localhost:5173` |
| **`homepage`** | Patient Home Companion (Voice Assistant, daily routine reminders, brain streak) | `http://localhost:5175` |
| **`caregiverpage`** | Caregiver Oversight Dashboard (Vitals, voice interaction timeline, game analytics, routines) | `http://localhost:5179` |
| **`Neuromusic`** | AI Music Therapy Player (Formative-era sitar/classical music, dynamic queue, audio player) | `http://localhost:5177` |
| **`Neurogames`** | Cognitive training games (Memory Match, Sequence Recall, Attention, Cultural Recall) | `http://localhost:5178` |

---

## 🔒 Security & Environment Setup

This project follows strict security separation between **Server-Side Secrets** and **Public Client Configurations**.

### 1. Classification of Keys

| Key | Scope | Location | Risk Level |
| :--- | :--- | :--- | :--- |
| `OPENROUTER_API_KEY` | **SERVER-ONLY** | `Neuronovai/.env` | 🚨 CRITICAL: Never expose to browser |
| `YOUTUBE_API_KEY` | **SERVER-ONLY** | `Neuronovai/.env` | 🚨 CRITICAL: Never expose to browser |
| `VITE_FIREBASE_*` | **PUBLIC CLIENT** | `authpage/.env.local` | ⚠️ Browser-exposed by design (enforce with Firebase Rules) |

> ⚠️ **CRITICAL RULE**: Never commit `.env` or `.env.local` files to Git. Only `.env.example` templates may be committed.

---

### 2. Backend Setup (`Neuronovai`)

1. Navigate to the backend directory:
   ```bash
   cd Neuronovai
   ```
2. Copy the template:
   ```bash
   cp .env.example .env
   ```
3. Fill in your server-side API keys in `Neuronovai/.env`:
   ```ini
   PORT=5001
   OPENROUTER_API_KEY=your_actual_openrouter_api_key
   OPENROUTER_MODEL=z-ai/glm-5.2:free
   YOUTUBE_API_KEY=your_actual_youtube_data_api_key
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5175,http://localhost:5177,http://localhost:5178,http://localhost:5179
   ```

#### API Restriction Recommendations:
- **OpenRouter Key**: Generate a dedicated key with usage limits at [OpenRouter Keys](https://openrouter.ai/keys).
- **YouTube Data API v3 Key**:
  - Visit [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
  - Under **API Restrictions**, restrict the key *strictly* to **YouTube Data API v3**.
  - Under **Application Restrictions**, select **IP addresses** and restrict to your backend server's IP address.

---

### 3. Frontend Auth Setup (`authpage`)

1. Navigate to the authentication directory:
   ```bash
   cd authpage
   ```
2. Copy the template:
   ```bash
   cp .env.example .env.local
   ```
3. Fill in your Firebase Web App credentials in `authpage/.env.local`:
   ```ini
   VITE_FIREBASE_API_KEY=your_firebase_web_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_web_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

#### Firebase Security Best Practices:
- Firebase Web API keys are client-accessible by design. Security is **not** achieved through hiding this key, but through:
  1. **Firestore Security Rules**: Restrict read/write operations to authenticated users for their own documents (`request.auth != null && request.auth.uid == userId`).
  2. **HTTP Referrer Restrictions**: Restrict your Google API key to authorized domain names (e.g., `http://localhost:*` for dev, and your production domain for deployment) in Google Cloud Console.

---

## 🚀 Running the Project Locally

### Option A: Automated One-Click Start (Windows)
Run the automated launch script from the project root:
```cmd
start-all.bat
```
or via PowerShell:
```powershell
.\start-all.ps1
```

### Option B: Manual Service-by-Service Launch
In separate terminal windows:
```bash
# 1. Backend AI Service (Port 5001)
cd Neuronovai && npm run dev

# 2. Auth Page (Port 5173)
cd authpage && npm run dev

# 3. Patient Home (Port 5175)
cd homepage && npm run dev

# 4. Neuromusic Player (Port 5177)
cd Neuromusic && npm run dev

# 5. Neurogames Hub (Port 5178)
cd Neurogames && npm run dev

# 6. Caregiver Dashboard (Port 5179)
cd caregiverpage && npm run dev
```

---

## 🛡️ Pre-Push Security Checklist

Before pushing any commits to a public GitHub repository:
- [x] Ensure `.env` and `.env.local` are not tracked (`git status`).
- [x] Verify SQLite databases (`Neuronovai/data/*.db`) and runtime logs (`logs/`) are ignored.
- [x] Verify no API keys or passwords appear in `git diff --staged`.
- [x] Run `npm run build` on all packages to ensure clean compilation.
- [x] Rotate any credentials that were previously committed or stored unencrypted in public spaces.

---

## 📄 License & Safety Notice

This application is designed as an assistive companion tool for elder support and cognitive engagement. It is **not a diagnostic or clinical medical device**. All cognitive exercise and routine adherence data is intended solely for family and caregiver awareness.
