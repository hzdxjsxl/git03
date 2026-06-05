@echo off
cd /d "%~dp0"
echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed. Please install Python 3.8 or higher.
    pause
    exit /b 1
)

echo Checking dependencies...
python -c "import pygame" >nul 2>&1
if errorlevel 1 (
    echo Installing required packages...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo Failed to install dependencies.
        pause
        exit /b 1
    )
)

echo Starting Pixel Dungeon Explorer...
python main.py
if errorlevel 1 (
    echo Game crashed. Press any key to exit...
    pause
)
