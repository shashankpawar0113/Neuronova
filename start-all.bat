@echo off
echo ====================================================
echo Starting NeuroNova Unified Platform...
echo ====================================================

start "NeuroNova Backend (:5001)" cmd /k "cd /d \"%~dp0backend\" && npm run dev"
start "NeuroNova Frontend (:5173)" cmd /k "cd /d \"%~dp0frontend\" && npm run dev"

timeout /t 3 >nul 2>nul || ping 127.0.0.1 -n 4 >nul
start http://localhost:5173/

echo NeuroNova unified platform launched on http://localhost:5173!
