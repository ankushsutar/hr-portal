#!/bin/bash

# Ensure we are in the right directory
cd "$(dirname "$0")"

echo "Starting HRMS Platform Development Environment..."

# Export path for Go
if [ -d "./local_go/bin" ]; then
    export PATH=$PWD/local_go/bin:$PATH
fi
if ! command -v go &> /dev/null; then
    export PATH=$PATH:/home/cwd/go/pkg/mod/golang.org/toolchain@v0.0.1-go1.25.0.linux-amd64/bin:/home/cwd/go/bin:/usr/local/go/bin
fi

# Ensure Local PostgreSQL on port 5433 is running
echo "Checking local PostgreSQL database service..."
if ! /usr/lib/postgresql/16/bin/psql -h 127.0.0.1 -p 5433 -U hrms_user -d hrms_db -c "SELECT 1;" >/dev/null 2>&1; then
    echo "Starting local PostgreSQL server on port 5433..."
    /usr/lib/postgresql/16/bin/postgres -D "$PWD/.pgdata_local" -p 5433 -k "$PWD/.pgdata_local" &
    sleep 2
fi

export DATABASE_URL="postgres://hrms_user:@127.0.0.1:5433/hrms_db?sslmode=disable"

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
