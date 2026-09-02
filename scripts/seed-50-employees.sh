#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "========================================"
echo "    HRMS TEST DATA SEED INITIALIZING    "
echo "========================================"

RESET=0

for arg in "$@"; do
    case $arg in
        --reset) RESET=1 ;;
    esac
done

if ! command -v go &> /dev/null; then
    if [ -d "./local_go/bin" ]; then
        export PATH=$PWD/local_go/bin:$PATH
    else
        export PATH=$PATH:/home/cwd/go/pkg/mod/golang.org/toolchain@v0.0.1-go1.25.0.linux-amd64/bin:/home/cwd/go/bin:/usr/local/go/bin
    fi
fi

if ! command -v go &> /dev/null; then
    echo "ERROR: Go is not installed or not in PATH."
    exit 1
fi

if [ ! -f "backend/scripts/seed_50_test_employees.go" ]; then
    echo "ERROR: Seed script backend/scripts/seed_50_test_employees.go not found."
    exit 1
fi

cd backend

if [[ $RESET -eq 1 ]]; then
    echo "Running in RESET mode: Test data will be cleared and recreated."
    go run scripts/seed_50_test_employees.go --reset
else
    go run scripts/seed_50_test_employees.go
fi

echo "Creating Manifest..."
mkdir -p ../tmp
cat <<EOF > ../tmp/test-data-manifest.json
{
  "namespace": "HRMS_TEST",
  "employees": 50,
  "managers": 5,
  "departments": 8,
  "locations": 4,
  "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

echo "Generated: tmp/test-data-manifest.json"
