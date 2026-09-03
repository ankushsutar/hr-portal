#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "========================================"
echo "    HRMS PAYROLL TEST DATA SEEDER       "
echo "========================================"

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

if [ ! -f "backend/scripts/seed_payroll_test_data.go" ]; then
    echo "ERROR: Seed script backend/scripts/seed_payroll_test_data.go not found."
    exit 1
fi

cd backend
go run scripts/seed_payroll_test_data.go "$@"

cd ..
mkdir -p tmp
cat <<EOF > tmp/payroll-seed-manifest.json
{
  "status": "SEEDED",
  "period": "$(date +%m/%Y)",
  "seededAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

echo "Generated: tmp/payroll-seed-manifest.json"
