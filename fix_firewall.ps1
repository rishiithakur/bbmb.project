# BBMC - Windows Firewall Fix for Django Backend
# Run this in an ELEVATED (Admin) PowerShell window
# Right-click PowerShell -> "Run as administrator" -> paste this entire block

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " BBMC Firewall Fix - Allowing Django Port 8000" -ForegroundColor Cyan
Write-Host "============================================================"
Write-Host ""

# Step 1: Remove any stale conflicting rules
Write-Host "[1] Removing old conflicting rules..." -ForegroundColor Yellow
Remove-NetFirewallRule -DisplayName "BBMC Django Backend Port 8000" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "Django Backend Port 8000" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "BBMC Python Inbound" -ErrorAction SilentlyContinue

# Step 2: Allow port 8000 inbound on ALL profiles (Domain, Private, Public)
Write-Host "[2] Adding inbound rule: TCP port 8000 (all profiles)..." -ForegroundColor Yellow
New-NetFirewallRule `
    -DisplayName "BBMC Django Backend Port 8000" `
    -Direction Inbound `
    -Action Allow `
    -Protocol TCP `
    -LocalPort 8000 `
    -Profile Any `
    -Description "Allows Django dev server on port 8000 for BBMC LAN and mobile access"
Write-Host "[OK] Port 8000 inbound rule added." -ForegroundColor Green

# Step 3: Allow python.exe inbound on ALL profiles
$pythonPath = "C:\Python314\python.exe"
if (Test-Path $pythonPath) {
    Write-Host "[3] Adding inbound rule for python.exe: $pythonPath ..." -ForegroundColor Yellow
    New-NetFirewallRule `
        -DisplayName "BBMC Python Inbound" `
        -Direction Inbound `
        -Action Allow `
        -Program $pythonPath `
        -Profile Any `
        -Description "Allows Python (Django) to receive inbound connections for BBMC"
    Write-Host "[OK] python.exe inbound rule added." -ForegroundColor Green
} else {
    Write-Host "[WARN] python.exe not found at $pythonPath - only port rule applied." -ForegroundColor Yellow
}

# Step 4: Verify rules exist
Write-Host ""
Write-Host "[4] Verifying created rules..." -ForegroundColor Yellow
Get-NetFirewallRule -DisplayName "BBMC Django Backend Port 8000" | Select-Object DisplayName, Direction, Action, Enabled, Profile
Get-NetFirewallRule -DisplayName "BBMC Python Inbound" -ErrorAction SilentlyContinue | Select-Object DisplayName, Direction, Action, Enabled, Profile

# Step 5: Confirm Django binding
Write-Host ""
Write-Host "[5] Active listeners on port 8000:" -ForegroundColor Yellow
netstat -ano | Select-String ":8000"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host " DONE. Now test from mobile browser:" -ForegroundColor Green
Write-Host " http://192.168.31.81:8000/api/v1/health/" -ForegroundColor White
Write-Host "============================================================"
