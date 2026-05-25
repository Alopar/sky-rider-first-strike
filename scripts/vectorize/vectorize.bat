@echo off
setlocal
cd /d "%~dp0"

set "VENV_PY=.venv\Scripts\python.exe"
set "VENV_PYW=.venv\Scripts\pythonw.exe"
set "VENV_PIP=.venv\Scripts\pip.exe"

if not exist "%VENV_PY%" (
    echo Creating virtual environment...
    py -3 -m venv .venv
    if errorlevel 1 (
        echo Failed to create venv. Install Python 3.10+ and try again.
        pause
        exit /b 1
    )
)

if not exist "%VENV_PY%" (
    echo Python not found in .venv
    pause
    exit /b 1
)

echo Installing dependencies...
"%VENV_PIP%" install -q -r requirements.txt
if errorlevel 1 (
    echo pip install failed.
    pause
    exit /b 1
)

if exist "%VENV_PYW%" (
    start "" "%VENV_PYW%" vectorize_gui.py
) else (
    "%VENV_PY%" vectorize_gui.py
)

if errorlevel 1 (
    echo GUI failed to start.
    pause
    exit /b 1
)

endlocal
