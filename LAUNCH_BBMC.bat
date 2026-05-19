@echo off
setlocal
echo ===================================================
echo   BBMC Dam Water Level Monitoring System
echo ===================================================
echo.

:: 1. Start/check PostgreSQL service
echo Checking and Starting PostgreSQL services...
set PG_SERVICE_FOUND=0

:: Try starting common postgresql service names directly first
net start postgresql-x64-15 >nul 2>&1
net start postgresql-x64-16 >nul 2>&1
net start postgresql-x64-17 >nul 2>&1
net start postgresql-x64-18 >nul 2>&1
net start postgresql >nul 2>&1

:: Double check if any service is running
sc query state= all | findstr /i "postgresql postgres" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] PostgreSQL service recognized.
) else (
    echo [WARNING] No standard PostgreSQL service name was matched in SC query. We will attempt direct DB connectivity.
)

:: Check for python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    pause
    exit /b
)

:: Check for node
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    pause
    exit /b
)

:: 2. Verify database connectivity
echo.
echo Verifying Database Connectivity...
cd backend
python manage.py check --database default
if %errorlevel% neq 0 (
    echo [ERROR] Database connection failed. Please check PostgreSQL credentials and ensure it is running on port 5433.
    cd ..
    pause
    exit /b
)
echo [OK] Database connection established successfully!
cd ..

:: 3. Start Django backend
echo.
echo Starting Backend Server...
start "BBMC Backend" cmd /k "cd backend && python manage.py runserver"

:: 4. Start frontend
echo Starting Frontend Dev Server...
start "BBMC Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Waiting 8 seconds for servers to initialize...
timeout /t 8 /nobreak > nul

:: 5. Confirm API authentication is connected properly
echo.
echo Confirming API authentication...
cd backend
python test_login.py
if %errorlevel% neq 0 (
    echo [ERROR] API Authentication verification failed! Please check if Django server is still running.
    cd ..
    pause
    exit /b
)
cd ..

echo.
echo Opening Login Page...
start chrome "http://localhost:5173/login"

echo.
echo Login Credentials:
echo -------------------
echo Admin Username: admin_master
echo Admin Password: DamAdmin@2026
echo.
echo Note: If the page doesn't load, please wait a few more seconds and refresh.
echo.
pause
