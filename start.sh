#!/bin/bash

# Ensure we are in the right directory
cd "$(dirname "$0")"

echo "Starting HRMS Platform Development Environment..."

# Export path for local go if it exists
if [ -d "./local_go/bin" ]; then
    export PATH=$PWD/local_go/bin:$PATH
fi

# Try to start docker-compose (ignore if it fails due to permissions or if docker is not installed)
echo "Attempting to start database services via docker-compose..."
docker-compose up -d 2>/dev/null || echo "Warning: Could not start docker-compose (this is fine if you just want to preview the UI)."

echo "Starting Go Backend on port 8080..."
cd backend
go run ./cmd/api &
BACKEND_PID=$!
cd ..

echo "Starting Vite Frontend Development Server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "--------------------------------------------------------"
echo "✅ HRMS is now running!"
echo "➡️  Frontend: http://localhost:5173"
echo "➡️  Backend:  http://localhost:8080"
echo "--------------------------------------------------------"
echo "Press Ctrl+C to stop both servers."

# Trap Ctrl+C to kill background processes
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM

# Keep script running
wait $BACKEND_PID $FRONTEND_PID
