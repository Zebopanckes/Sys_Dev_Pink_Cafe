# Bristol Pink Dashboard - Startup Script
# Starts both backend and frontend servers

Write-Host "Starting Bristol Pink Dashboard..." -ForegroundColor Cyan
Write-Host ""

# Start backend in new PowerShell window
Write-Host "Starting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; python app.py"

# Wait for backend to initialize
Start-Sleep -Seconds 2

# Start frontend in new PowerShell window
Write-Host "Starting frontend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run dev"

Write-Host ""
Write-Host "Both servers are starting in separate windows." -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor White
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Close the PowerShell windows to stop the servers." -ForegroundColor Gray
