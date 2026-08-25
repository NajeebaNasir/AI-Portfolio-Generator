# PowerShell Launcher for AI Portfolio Generator Agent with Automated Port Cleanup
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "🚀 Launching AI Portfolio Generator Agent..." -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Cyan

# 1. Automated Port Cleanup
Write-Host "🧹 Checking and freeing ports 3001, 5173, and 5174..." -ForegroundColor Yellow
$ports = @(3001, 5173, 5174)
foreach ($port in $ports) {
    try {
        $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        foreach ($conn in $conns) {
            if ($conn.OwningProcess -gt 0) {
                Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
            }
        }
    } catch {}
}

$nodeDir = "C:\Program Files\nodejs;$env:LOCALAPPDATA\Programs\nodejs"
$env:PATH = "$nodeDir;$env:PATH"

Write-Host "2. Starting Backend API Server (Port 3001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PATH = '$nodeDir;' + `$env:PATH; npm run dev --prefix apps/server"

Start-Sleep -Seconds 2

Write-Host "3. Starting Frontend Web Studio (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PATH = '$nodeDir;' + `$env:PATH; npm run dev --prefix apps/web"

Start-Sleep -Seconds 3

Write-Host "4. Opening http://localhost:5173 ..." -ForegroundColor Green
Start-Process "http://localhost:5173"

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "✅ Both servers launched successfully!" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Cyan
