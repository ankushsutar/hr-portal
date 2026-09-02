# Local Development Guide

Welcome to the HRMS local development environment. This document outlines how to set up, run, and populate the system with isolated test data to ensure deterministic QA and development workflows.

## Quick Start

If you have already installed dependencies (`npm install` and Go modules), you can initialize your environment from a cold state simply by running the recommended full loop:

```bash
# 1. Stop any lingering services
bash scripts/stop-all.sh

# 2. Reset the PostgreSQL database schema
bash scripts/reset-db.sh --force

# 3. Seed 50 deterministic test employees and RBAC hierarchy
bash scripts/seed-50-employees.sh

# 4. Start the frontend (5173) and backend (8080)
bash scripts/start-fresh.sh
```

## Infrastructure Architecture

Our local development setup relies on several unified scripts in the `scripts/` directory to ensure environment consistency across different developer machines. 

### Data Isolation
We strongly enforce data isolation for all UI development and QA.
- **The `HRMS_TEST` Namespace:** When running the seeding script, all dummy data generated receives a `@test.hrms.local` email domain and a `TEST_EMP_` ID prefix. 
- **Idempotent Resets:** Because dummy data is namespaced, running `bash scripts/seed-50-employees.sh --reset` safely deletes ONLY the synthetic test data, preserving any real developer configurations you may have added.

### RBAC Hierarchy (For UI Testing)
The seeding script dynamically structures a 50-person organization to help validate Role-Based Access Control boundaries on the frontend:
- **1 HR Admin** (Global view, cross-department modification access).
- **5 Managers** (Direct report visibility and approval permissions).
- **50 Employees** (Distributed 10 per manager, limited to self-service views).

By logging in as `manager_01@test.hrms.local` vs `employee_005@test.hrms.local`, developers can strictly verify that the backend scopes and frontend routing correctly hide unauthorized data. (Password for all test accounts is `password123`).

## Environment Variables
Ensure your local `.env` file at the root contains the following at minimum:
```env
APP_ENV=development
POSTGRES_PORT=5433
DATABASE_URL=postgres://hrms_user:hrms_password@localhost:5433/hrms_db?sslmode=disable
```
*(Note: Locally we bind Postgres to port `5433` via `.pgdata_local` to prevent conflicts with standard Postgres installations).*
