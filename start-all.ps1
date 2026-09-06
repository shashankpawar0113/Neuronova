# Start all NeuroNova services
$root = $PSScriptRoot

Write-Host "Starting all NeuroNova services..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\Neuronovai'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\authpage'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\homepage'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\Neuromusic'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\Neurogames'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\caregiverpage'; npm run dev"

Start-Sleep -Seconds 3
Start-Process "http://localhost:5175/"

Write-Host "All services started! Homepage opened at http://localhost:5175/" -ForegroundColor Green
