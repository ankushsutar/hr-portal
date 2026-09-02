#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "========================================"
echo "    HRMS LOCAL ENVIRONMENT SHUTDOWN     "
echo "========================================"

FRONTEND_PORT=5173
BACKEND_PORT=8080

kill_port() {
    local port=$1
    local name=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        PID=$(lsof -Pi :$port -sTCP:LISTEN -t | head -n 1)
        echo "  -> Stopping $name process on port $port (PID: $PID)..."
        kill $PID
        sleep 2
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
            echo "  -> Force killing PID $PID..."
            kill -9 $PID
        fi
        echo "  -> $name stopped."
    else
        echo "  -> No $name process found on port $port."
    fi
}

kill_port $BACKEND_PORT "Backend"
kill_port $FRONTEND_PORT "Frontend"

echo "========================================"
echo "All local services stopped."
echo "========================================"
