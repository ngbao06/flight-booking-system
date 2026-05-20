@echo off
setlocal

cd /d "%~dp0"

echo Starting Docker Compose...
docker compose up -d
if errorlevel 1 (
	echo Failed to start Docker Compose.
	exit /b 1
)

echo Waiting for frontend at http://localhost:8080 ...
for /l %%i in (1,1,60) do (
	curl -I -s http://localhost:8080 >nul 2>&1 && goto open_frontend
	timeout /t 2 >nul
)

echo Frontend is not ready yet. Please open http://localhost:8080 manually.
goto end

:open_frontend
start "" "http://localhost:8080"

:end
endlocal