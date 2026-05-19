@echo off
echo ============================================================
echo  BBMC - Windows Firewall Fix for Django Backend Port 8000
echo ============================================================
echo.

:: Check for administrator privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] This script must be run as Administrator.
    echo.
    echo Right-click fix_firewall.bat and select "Run as administrator"
    pause
    exit /b 1
)

echo [1] Removing any conflicting existing rules for port 8000...
netsh advfirewall firewall delete rule name="Django Backend Port 8000" >nul 2>&1
netsh advfirewall firewall delete rule name="BBMC Django Port 8000" >nul 2>&1

echo [2] Adding inbound TCP rule: Allow port 8000 on ALL profiles...
netsh advfirewall firewall add rule ^
    name="BBMC Django Backend Port 8000" ^
    dir=in ^
    action=allow ^
    protocol=TCP ^
    localport=8000 ^
    profile=any ^
    description="Allows Django development server on port 8000 for BBMC LAN and mobile access"

if %errorlevel% equ 0 (
    echo [OK] Inbound rule for port 8000 added successfully.
) else (
    echo [ERROR] Failed to add inbound rule.
)

echo.
echo [3] Adding inbound TCP rule: Allow python.exe on ALL profiles...
:: Find python.exe path
for /f "tokens=*" %%i in ('where python') do set PYTHON_PATH=%%i

if defined PYTHON_PATH (
    netsh advfirewall firewall add rule ^
        name="BBMC Python Inbound" ^
        dir=in ^
        action=allow ^
        program="%PYTHON_PATH%" ^
        profile=any ^
        description="Allows Python (Django) to receive inbound connections for BBMC"
    if %errorlevel% equ 0 (
        echo [OK] Python.exe inbound rule added: %PYTHON_PATH%
    ) else (
        echo [WARN] Could not add python.exe rule - port rule alone may be enough.
    )
) else (
    echo [WARN] python.exe path not found - skipping program rule.
)

echo.
echo [4] Verifying rules were added...
netsh advfirewall firewall show rule name="BBMC Django Backend Port 8000"

echo.
echo [5] Current listening status on port 8000...
netstat -ano | findstr ":8000"

echo.
echo ============================================================
echo  Firewall fix complete.
echo  Now test from mobile browser:
echo  http://192.168.31.81:8000/api/v1/health/
echo ============================================================
echo.
pause
