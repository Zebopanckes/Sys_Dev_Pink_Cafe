@echo off
REM Start both backend and frontend servers

echo Starting Bristol Pink Dashboard...
echo.

REM Start backend in new window
echo Starting backend server...
start "Backend - Flask" cmd /k "cd backend && python app.py"

REM Wait a moment for backend to initialize
timeout /t 2 /nobreak >nul

REM Start frontend in new window
echo Starting frontend server...
start "Frontend - Vite" cmd /k "npm run dev"

echo.
echo Both servers are starting in separate windows.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Close the terminal windows to stop the servers.
