@echo off
echo Starting DrugSafe AI Application...
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python and try again
    pause
    exit /b 1
)

REM Install requirements if needed
echo Installing/Checking requirements...
pip install -r requirements.txt

REM Start the application
echo.
echo Starting the application...
python run_app.py

pause

