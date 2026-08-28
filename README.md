# Enterprise HRMS Platform

A modern, high-density, production-grade **Enterprise Human Resource Management System (HRMS)** inspired by the developer-tool design philosophy of **skills.sh**.

Built with a **Go 1.23 REST Backend** and a **Vite + React 19 + TypeScript + Tailwind CSS v4 Frontend**, the platform delivers an enterprise workspace for managing employee lifecycles, attendance, leaves, payroll execution, recruitment, onboarding, universal approvals, proactive data quality auditing, and standard HR reporting.

---

## Key Features & Module Overview

- ⚡ **Developer Console Ergonomics**: High information density dark-mode interface (`#0B0F19` obsidian theme, `#111827` slate cards, hairline `border-slate-800` borders, tabular monospace metrics).
- 📥 **Universal Approval Center**: Centralized action inbox for Leaves, Attendance regularizations, WFH/OD requests, Salary Advances, and Exit Clearances with individual and multi-select **Bulk Action** controls.
- 📋 **HR Operations Task Center**: Proactive health metrics dashboard tracking probation confirmation reviews due, compliance document approvals, attendance anomalies, and payroll locks.
- 💰 **Payroll Run Engine**: 6-stage state machine (`DRAFT` → `PROCESSING` → `VALIDATED` → `APPROVED` → `LOCKED` → `PUBLISHED`) featuring automated Loss of Pay (LOP) calculations, salary advance deductions, variance tracking, and printable payslip generation.
- 🛡️ **Data Quality & Health Center**: Proactive diagnostic engine detecting missing managers, missing bank account/PAN details, default shift fallbacks, corporate email collisions, and unverified compliance documents with direct click-to-fix shortcuts.
- 📊 **Standard Reports & CSV Exporter**: 6 core reports (Headcount, New Joiners, Exits, Monthly Attendance Register, Leave Balances, Payroll Disbursement) with instant one-click CSV export engine.
- 👥 **Employee Directory & Onboarding**: Employee profile management, multi-step onboarding wizard, probation management, document verification, and offboarding clearances.
- 🕒 **Attendance & Shift Roster**: Real-time clock in/out, biometric punch simulation, shift assignment, regularization approvals, and WFH/OD workflows.
- 🔔 **Notification Center**: Integrated top-bar bell popover drawer for real-time operational system alerts.

---

## Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + Radix UI Primitives
- **Routing & State**: TanStack Router + TanStack Query (React Query)
- **Data Tables & Charts**: TanStack Table + Recharts
- **Icons**: Lucide React

### Backend
- **Language**: Go 1.23
- **HTTP Router**: Chi v5 Router
- **Database Driver**: `pgx/v5` PostgreSQL Connection Pool
- **Security**: JWT Authentication + Bcrypt Password Hashing

---

## Getting Started

### 1. Prerequisites
- Go `1.23+`
- Node.js `18+`
- PostgreSQL `14+`

### 2. Startup Script
Run the automated startup script:
```bash
bash start.sh
```

### 3. Manual Startup
```bash
# Start Backend API Server
cd backend
export PATH=$PWD/../local_go/bin:$PATH
go run ./cmd/api

# Start Frontend Dev Server (in another terminal)
cd frontend
npm run dev
```

The frontend application will be available at `http://localhost:5173` and the backend API at `http://localhost:8080`.

---

## Complete Development Sprint Roadmap

| Sprint | Module / Focus | Description | Status |
|---|---|---|---|
| **Sprint 1** | Foundation & Auth | Monorepo layout, PostgreSQL pool, JWT auth & RBAC | ✅ Completed |
| **Sprint 2** | Organization Structure | Company structure, departments, designations & locations | ✅ Completed |
| **Sprint 3** | Employee Master Directory | Employee directory, profile tabs, document attachments | ✅ Completed |
| **Sprint 4** | Attendance Core | Punch in/out, shift roster policy, biometric log ingestion | ✅ Completed |
| **Sprint 5** | Leave Management | Leave types, policy configuration, leave balance engine | ✅ Completed |
| **Sprint 6** | Basic Payroll | Salary structure template, payroll components & payslips | ✅ Completed |
| **Sprint 7** | Employee Onboarding | Multi-step onboarding templates, tasks & progress tracking | ✅ Completed |
| **Sprint 8** | Recruitment & ATS | Job openings, candidate pipeline, interview feedback & offers | ✅ Completed |
| **Sprint 9** | Advanced Attendance | Attendance regularization, WFH/OD requests, supervisor sign-offs | ✅ Completed |
| **Sprint 10** | Employee Offboarding | Resignation requests, exit checklist, clearance sign-offs | ✅ Completed |
| **Sprint 11** | Payroll Engine Part 1 | State machine (`DRAFT`➔`PUBLISHED`), LOP integration, advance deductions | ✅ Completed |
| **Sprint 12** | Universal Approval Center | Unified inbox, HR Task Center, notification drawer bell | ✅ Completed |
| **Sprint 13** | Data Quality & Reports | Proactive health audit, click-to-fix shortcuts, 6 reports & CSV exporter | ✅ Completed |
| **Sprint 14** | UAT & Final Polishing | End-to-end scenario validation, documentation & code polish | 🚀 In Progress |

---

## System Documentation

- [DESIGN.md](file:///home/cwd/portal/hr-portal/DESIGN.md) — Visual design system, color palette tokens, typography rules & component specs.
- [ARCHITECTURE.md](file:///home/cwd/portal/hr-portal/ARCHITECTURE.md) — High-level architecture blueprint, folder structure & DB migration system.
- [UX_GUIDELINES.md](file:///home/cwd/portal/hr-portal/UX_GUIDELINES.md) — User experience guidelines, key user flows & accessibility standards.
- [CONTRIBUTING.md](file:///home/cwd/portal/hr-portal/CONTRIBUTING.md) — Developer setup instructions, coding conventions & PR standards.
