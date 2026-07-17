@echo off
echo.
echo  ╔══════════════════════════════════════╗
echo  ║       Clarinet Coach Lite            ║
echo  ║   Starting local server...           ║
echo  ╚══════════════════════════════════════╝
echo.

:: Try python first, then py launcher
where python >nul 2>&1
if %errorlevel% == 0 (
    echo  Open http://localhost:8080 in your browser
    echo  Press Ctrl+C to stop
    echo.
    python server.py
) else (
    where py >nul 2>&1
    if %errorlevel% == 0 (
        echo  Open http://localhost:8080 in your browser
        echo  Press Ctrl+C to stop
        echo.
        py server.py
    ) else (
        echo  ERROR: Python not found. Please install Python from python.org
        pause
        exit /b 1
    )
)
pause
