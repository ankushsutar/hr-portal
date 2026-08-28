# Contributing to Enterprise HRMS

Thank you for contributing to the Enterprise HRMS platform! This document provides instructions for setting up your development environment, running tests, creating database migrations, and adhering to codebase conventions.

---

## 1. Local Development Setup

### Prerequisites
- **Go**: Version `1.23.0` or higher
- **Node.js**: Version `18.0.0` or higher (`npm` / `npx`)
- **PostgreSQL**: Version `14` or higher

### Environment Setup
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Configure database connection parameters in `.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_NAME=hrms
   JWT_SECRET=your_jwt_secret_key
   PORT=8080
   ```

### Running the Application
Use the provided startup script:
```bash
bash start.sh
```
Or run the services manually:
```bash
# Backend Go Service
cd backend
export PATH=$PWD/../local_go/bin:$PATH
go run ./cmd/api

# Frontend Vite Dev Server (in another terminal)
cd frontend
npm run dev
```

---

## 2. Codebase Conventions

### Frontend Conventions
- **TypeScript Strictness**: Strict mode is enabled. Do not use `any` unless absolutely necessary for external vendor typings.
- **Styling**: Use Tailwind CSS v4 classes adhering strictly to `DESIGN.md` dark mode guidelines (`#0B0F19` obsidian background, `#111827` slate cards, `border-slate-800` hairline borders).
- **Data Fetching**: Use `@tanstack/react-query` for server state management and caching.
- **Form Controls**: Use controlled components with clear error state handling.

### Backend Conventions
- **Go Package Structure**: Features are encapsulated inside `internal/<feature>` packages (e.g. `internal/payroll`, `internal/workflow`, `internal/reports`).
- **Database Access**: Use `pgxpool.Pool` for thread-safe PostgreSQL connection pooling.
- **HTTP Routing**: Use `github.com/go-chi/chi/v5` for lightweight, modular HTTP routing.
- **JSON Standard**: API responses must return structured JSON:
  ```json
  {
    "success": true,
    "message": "Action completed successfully",
    "data": {}
  }
  ```

---

## 3. Database Migrations

All database schema modifications must be created as versioned SQL migration files inside `backend/migrations/`:
- Format: `0000XX_sprint_name.up.sql`
- Example: `000022_sprint13_data_quality_reports.up.sql`

To apply migrations manually:
```bash
cd backend
go run ./cmd/api -migrate
```

---

## 4. Verification & Testing

Before submitting code, always run the full build verification suite:

```bash
# 1. Verify Frontend TypeScript & Vite Bundle
cd frontend
npx tsc --noEmit
npm run build

# 2. Verify Backend Go Compilation
cd backend
export PATH=$PWD/../local_go/bin:$PATH
go build ./...
```
Both commands must pass with **0 errors**.
