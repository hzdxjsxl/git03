$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "Checking Python installation..."
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Python found: $pythonVersion"
} catch {
    Write-Host "Python is not installed. Please install Python 3.8 or higher."
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Checking dependencies..."
try {
    python -c "import pygame" 2>&1 | Out-Null
    Write-Host "Dependencies satisfied."
} catch {
    Write-Host "Installing required packages..."
    pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install dependencies."
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host "Starting Pixel Dungeon Explorer..."
python main.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "Game crashed. Press Enter to exit..."
    Read-Host
}
