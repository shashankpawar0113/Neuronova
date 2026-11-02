# Start NeuroNova Unified Platform
$item = Get-Item $PSScriptRoot
$root = if ($item.Target) { $item.Target } else { $item.FullName }

Write-Host "Starting NeuroNova Unified Platform from $root..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\frontend'; npm run dev"

Start-Sleep -Seconds 3
Start-Process "http://localhost:5173/"

Write-Host "NeuroNova unified platform running at http://localhost:5173/" -ForegroundColor Green
