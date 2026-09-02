# HRMS Script Infrastructure

This directory contains utility scripts for managing the HRMS local development and test environment. These scripts ensure a deterministic, reproducible, and safe infrastructure for developers and QA engineers.

## Core Scripts

### 1. `start-fresh.sh`
Gracefully stops any existing backend (8080) or frontend (5173) processes, checks database health, and performs a clean startup of the entire HRMS stack.
```bash
./scripts/start-fresh.sh
```

### 2. `stop-all.sh`
Identifies and forcefully kills any lingering Node.js (Vite) or Go processes running on the HRMS ports. Useful for completely shutting down the background processes.
```bash
./scripts/stop-all.sh
```

### 3. `reset-db.sh`
Performs a complete wipe of the `public` schema in PostgreSQL, followed by applying all sequential Go-based SQL migrations.
- **Safety check:** Enforces `APP_ENV=development` to prevent catastrophic drops in production.
- **Usage:** Run `./scripts/reset-db.sh` (prompts for confirmation) or `./scripts/reset-db.sh --force`.

### 4. `seed-50-employees.sh`
Compiles and runs the Go seeding engine (`seed_50_test_employees.go`), deterministically generating exactly 50 test employees along with a hierarchy of Managers and HR roles.
- **Namespacing:** All test users are assigned a `@test.hrms.local` email for strict data isolation.
- **Reset Mode:** Run with `--reset` to clear any previous `test.hrms.local` data before recreating.
- **Output:** Generates `tmp/test-data-manifest.json` for frontend E2E testing reference.

## Recommended Workflow (The Full Loop)

Whenever you switch branches, encounter corrupted data, or need to run a fresh suite of E2E tests:

1. Stop existing services: `bash scripts/stop-all.sh`
2. Reset the database: `bash scripts/reset-db.sh --force`
3. Seed the deterministic QA data: `bash scripts/seed-50-employees.sh`
4. Start the stack: `bash scripts/start-fresh.sh`
