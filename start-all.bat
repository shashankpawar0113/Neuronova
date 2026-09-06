@echo off
echo ====================================================
echo Starting all NeuroNova services...
echo ====================================================

start "Neuronovai (AI Backend :5001)" cmd /k "cd /d \"%~dp0Neuronovai\" && npm run dev"
start "Auth Page (:5174)" cmd /k "cd /d \"%~dp0authpage\" && npm run dev"
start "Homepage (:5175)" cmd /k "cd /d \"%~dp0homepage\" && npm run dev"
start "NeuroMusic (:5177)" cmd /k "cd /d \"%~dp0Neuromusic\" && npm run dev"
start "Neurogames (:5178)" cmd /k "cd /d \"%~dp0Neurogames\" && npm run dev"
start "Caregiver Hub (:5179)" cmd /k "cd /d \"%~dp0caregiverpage\" && npm run dev"

timeout /t 3 /nobreak >nul
start http://localhost:5175/

echo All services launched!
