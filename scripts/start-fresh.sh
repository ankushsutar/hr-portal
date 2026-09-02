#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "========================================"
echo "    HRMS LOCAL ENVIRONMENT STARTUP      "
echo "========================================"

NO_FRONTEND=0
NO_BACKEND=0

for arg in "$@"; do
    case $arg in
        --no-frontend) NO_FRONTEND=1 ;;
        --no-backend) NO_BACKEND=1 ;;
    esac
done

FRONTEND_PORT=5173
BACKEND_PORT=8080

mkdir -p logs .tmp

# 1. Process Cleanup
echo "[1/4] Cleaning up existing processes..."

kill_port() {
    local port=$1
    local name=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        PID=$(lsof -Pi :$port -sTCP:LISTEN -t | head -n 1)
        echo "  -> Found existing $name process on port $port (PID: $PID). Stopping..."
        kill $PID
        sleep 2
        # Force kill if still running
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
            echo "  -> Force killing PID $PID..."
            kill -9 $PID
        fi
    else
        echo "  -> No existing $name process found on port $port."
    fi
}

if [[ $NO_BACKEND -eq 0 ]]; then
    kill_port $BACKEND_PORT "Backend"
fi

if [[ $NO_FRONTEND -eq 0 ]]; then
    kill_port $FRONTEND_PORT "Frontend"
fi

# 2. Start Backend
if [[ $NO_BACKEND -eq 0 ]]; then
    echo "[2/4] Starting Go Backend (Port $BACKEND_PORT)..."
    
    # We must ensure the local postgres is running (mimicking start.sh behavior)
    if ! psql -h 127.0.0.1 -p 5433 -U hrms_user -d hrms_db -c "SELECT 1;" >/dev/null 2>&1; then
        echo "  -> Local PostgreSQL daemon is not running on 5433. Starting it..."
        /usr/lib/postgresql/16/bin/postgres -D "$PWD/.pgdata_local" -p 5433 -k "$PWD/.pgdata_local" &
        sleep 3
    fi
    
    # Export path for Go
    if [ -d "./local_go/bin" ]; then
        export PATH=$PWD/local_go/bin:$PATH
    fi
    if ! command -v go &> /dev/null; then
        export PATH=$PATH:/home/cwd/go/pkg/mod/golang.org/toolchain@v0.0.1-go1.25.0.linux-amd64/bin:/home/cwd/go/bin:/usr/local/go/bin
    fi
    
    cd backend
    export DATABASE_URL="postgres://hrms_user:hrms_password@localhost:5433/hrms_db?sslmode=disable"
    nohup go run ./cmd/api > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../.tmp/backend.pid
    cd ..

    echo "  -> Waiting for backend to become healthy..."
    MAX_RETRIES=15
    RETRY=0
    HEALTHY=0
    while [ $RETRY -lt $MAX_RETRIES ]; do
        if curl -s http://localhost:$BACKEND_PORT/api/v1/attendance/logs > /dev/null; then
            HEALTHY=1
            break
        fi
        sleep 2
        RETRY=$((RETRY + 1))
    done

    if [ $HEALTHY -eq 0 ]; then
        echo "ERROR: Backend failed to start. See logs/backend.log"
        cat logs/backend.log | tail -n 15
        exit 1
    fi
    echo "  -> Backend is healthy! (PID: $BACKEND_PID)"
else
    echo "[2/4] Skipping Backend startup (--no-backend)"
fi

# 3. Start Frontend
if [[ $NO_FRONTEND -eq 0 ]]; then
    echo "[3/4] Starting Vite Frontend (Port $FRONTEND_PORT)..."
    cd frontend
    nohup npm run dev > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../.tmp/frontend.pid
    cd ..
    
    echo "  -> Waiting for frontend to become available..."
    MAX_RETRIES=15
    RETRY=0
    HEALTHY=0
    while [ $RETRY -lt $MAX_RETRIES ]; do
        if curl -s http://localhost:$FRONTEND_PORT > /dev/null; then
            HEALTHY=1
            break
        fi
        sleep 2
        RETRY=$((RETRY + 1))
    done

    if [ $HEALTHY -eq 0 ]; then
        echo "ERROR: Frontend failed to start. See logs/frontend.log"
        cat logs/frontend.log | tail -n 15
        if [[ $NO_BACKEND -eq 0 ]]; then
             echo "NOTE: Backend remains running."
        fi
        exit 1
    fi
    echo "  -> Frontend is ready! (PID: $FRONTEND_PID)"
else
    echo "[3/4] Skipping Frontend startup (--no-frontend)"
fi

# 4. Display Status
echo "[4/4] Environment Ready"
echo "========================================"

if [[ $NO_BACKEND -eq 0 ]]; then
echo "Backend:"
echo "  Status: RUNNING"
echo "  PID: $(cat .tmp/backend.pid 2>/dev/null)"
echo "  URL: http://localhost:$BACKEND_PORT"
echo "  Logs: logs/backend.log"
fi

if [[ $NO_FRONTEND -eq 0 ]]; then
echo "Frontend:"
echo "  Status: RUNNING"
echo "  PID: $(cat .tmp/frontend.pid 2>/dev/null)"
echo "  URL: http://localhost:$FRONTEND_PORT"
echo "  Logs: logs/frontend.log"
fi
echo "========================================"
