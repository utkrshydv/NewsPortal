@echo off
echo =======================================================
echo      Starting News Portal Microservices Architecture
echo =======================================================
echo.

echo [1/3] Starting ML Microservice (FastAPI) on Port 8000...
start "ML Service" cmd /k "cd ml_service && call venv\Scripts\activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/3] Starting Backend API (FastAPI) on Port 8001...
start "Backend Service" cmd /k "cd backend && call venv\Scripts\activate && uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload"

echo [3/3] Starting React Frontend on Port 5173...
start "React Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo All services have been launched in separate terminal windows!
echo - Frontend: http://localhost:5173
echo - Backend API: http://localhost:8001
echo - ML API: http://localhost:8000
echo.
echo You can safely close this master window.

