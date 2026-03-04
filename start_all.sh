#!/bin/bash
echo "======================================================="
echo "     Starting News Portal Microservices Architecture"
echo "======================================================="
echo ""

# Function to cleanly kill background processes when stopping the script
cleanup() {
    echo ""
    echo "Stopping all services..."
    kill $(jobs -p) 2>/dev/null
    exit
}
trap cleanup SIGINT SIGTERM

echo "[1/3] Starting ML Microservice (FastAPI) on Port 8000..."
(cd ml_service && source venv/Scripts/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload) &

echo "[2/3] Starting Node.js Backend on Port 5000..."
(cd backend && node server.js) &

echo "[3/3] Starting React Frontend on Port 5173..."
(cd frontend && npm run dev) &

echo ""
echo "All services are running in the background!"
echo " - Frontend: http://localhost:5173"
echo " - Backend API: http://localhost:5000"
echo " - ML API: http://localhost:8000"
echo ""
echo "Press Ctrl+C to instantly stop all three services."

# Wait for all background jobs so the script doesn't exit immediately
wait
