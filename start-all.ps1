# Start all NeuroNova services
$item = Get-Item $PSScriptRoot
$root = if ($item.Target) { $item.Target } else { $item.FullName }

Write-Host "Starting all NeuroNova services from $root..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\Neuronovai'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\authpage'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\homepage'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\Neuromusic'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\Neurogames'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\caregiverpage'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\healthworker'; npm run dev"

Start-Sleep -Seconds 4
Start-Process "http://localhost:5174/"

Write-Host "All services started! Auth portal opened at http://localhost:5174/" -ForegroundColor Green
