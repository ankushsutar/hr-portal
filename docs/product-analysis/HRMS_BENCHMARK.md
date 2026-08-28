# HRMS Product Benchmark Matrix

> **Comparison Scope:** Features relevant to our Phase 1–3 roadmap only.
> Products compared: Our HRMS, Horilla, Frappe HR, OrangeHRM, Sentrifugo.
> Sources: Public documentation, GitHub repositories, established HRMS domain knowledge.

---

## Legend

| Decision | Meaning |
|---|---|
| **BUILD NOW** | Required for Phase 1; implement immediately |
| **BUILD LATER** | Phase 2 or 3; design now, implement later |
| **CONFIGURE** | Exists in skeleton form; needs configuration capability |
| **INTEGRATE** | Needs external system integration |
| **RESEARCH** | Needs more investigation before decision |
| **REJECT** | Not relevant to our company |

---

## Core Employee Management

| Capability | Our HRMS | Horilla | Frappe HR | OrangeHRM | Needed | Priority | Decision |
|---|---|---|---|---|---|---|---|
| Employee Master | Basic | Mature | Mature | Mature | Yes | P0 | **BUILD NOW** — upgrade profile richness |
| Employee ID generation | Manual | Configurable | Configurable | Configurable | Yes | P0 | **BUILD NOW** |
| Employee categories (permanent/contract) | Missing | Available | Available | Available | Yes | P0 | **BUILD NOW** |
| Department hierarchy | Basic | Available | Available | Available | Yes | P0 | **CONFIGURE** — exists, needs depth |
| Designation management | Basic | Available | Available | Available | Yes | P0 | **BUILD NOW** |
| Employee profile photo | Missing | Available | Available | Available | Yes | P1 | **BUILD LATER** |
| Org chart | Missing | Available | Available | Available | Yes | P1 | **BUILD LATER** |
| Employee search/filter | Basic | Advanced | Advanced | Advanced | Yes | P0 | **BUILD NOW** |
| Bulk employee operations | Missing | Available | Partial | Partial | Yes | P0 | **BUILD NOW** |
| Employee export | Missing | Available | Available | Available | Yes | P0 | **BUILD NOW** |
| Employee audit trail | DB table only | Available | Available | Available | Yes | P0 | **BUILD NOW** |

---

## User & Access Management

| Capability | Our HRMS | Horilla | Frappe HR | OrangeHRM | Needed | Priority | Decision |
|---|---|---|---|---|---|---|---|
| User management UI | Basic (built) | Mature | Mature | Mature | Yes | P0 | **BUILD NOW** — enhance existing |
| Role-based access control | Basic | Mature | Mature | Mature | Yes | P0 | **BUILD NOW** |
| Data scopes (SELF/DEPT/ORG) | Missing | Partial | Available | Available | Yes | P0 | **BUILD NOW** |
| User invitation flow | Basic | Available | Available | Available | Yes | P0 | **BUILD NOW** |
| User-employee 1:1 mapping | Partial | Available | Available | Available | Yes | P0 | **BUILD NOW** |
| Session management | Missing | Available | Available | Available | Yes | P0 | **BUILD NOW** |
| Login history | Missing | Available | Available | Available | Yes | P1 | **BUILD LATER** |
| Password reset flow | Missing | Available | Available | Available | Yes | P0 | **BUILD NOW** |
| Bulk user provisioning | Missing | Available | Partial | Partial | Yes | P0 | **BUILD NOW** |
| SSO / OAuth | Missing | Missing | Available | Enterprise | No | P4 | **REJECT** for now |

---

## Employee Lifecycle

| Capability | Our HRMS | Horilla | Frappe HR | OrangeHRM | Needed | Priority | Decision |
|---|---|---|---|---|---|---|---|
| Lifecycle event model | Basic (table) | Partial | Available | Available | Yes | P0 | **BUILD NOW** |
| Employee timeline | Missing | Missing | Partial | Missing | Yes | P0 | **BUILD NOW** — differentiation |
| Probation management | Basic | Available | Available | Available | Yes | P0 | **BUILD NOW** |
| Confirmation workflow | Missing | Available | Available | Available | Yes | P0 | **BUILD NOW** |
| Probation extension | Missing | Available | Partial | Available | Yes | P0 | **BUILD NOW** |
| Termination | Basic | Available | Available | Available | Yes | P0 | **BUILD NOW** |
| Transfer (dept/location) | Basic (table) | Available | Available | Available | Yes | P1 | **BUILD LATER** |
| Promotion | Basic (table) | Available | Available | Available | Yes | P1 | **BUILD LATER** |
| Effective-dated history | Missing | Available | Available | Available | Yes | P0 | **BUILD NOW** |

---

## Onboarding

| Capability | Our HRMS | Horilla | Frappe HR | OrangeHRM | Needed | Priority | Decision |
|---|---|---|---|---|---|---|---|
| Onboarding templates | Basic (built) | Available | Available | Partial | Yes | P0 | **BUILD NOW** — mature existing |
| Onboarding tasks | Basic (built) | Available | Available | Partial | Yes | P0 | **BUILD NOW** |
| Task owner roles | Basic | Available | Available | Missing | Yes | P0 | **BUILD NOW** |
| Task dependencies | Missing | Unknown | Available | Missing | Yes | P1 | **BUILD LATER** |
| Document checklist | Basic (built) | Available | Available | Partial | Yes | P0 | **BUILD NOW** |
| Document upload/verification | Basic | Available | Available | Available | Yes | P0 | **BUILD NOW** |
| Bulk onboarding | Missing | Missing | Partial | Missing | Yes | P0 | **BUILD NOW** |
| Auto-user provisioning on onboard | Missing | Partial | Partial | Missing | Yes | P0 | **BUILD NOW** |
| Onboarding progress tracking | Missing | Available | Available | Missing | Yes | P0 | **BUILD NOW** |

---

## Bulk Import

| Capability | Our HRMS | Horilla | Frappe HR | OrangeHRM | Needed | Priority | Decision |
|---|---|---|---|---|---|---|---|
| CSV/Excel import | Wizard (built) | Available | Available | Available | Yes | P0 | **BUILD NOW** — complete engine |
| Column mapping | Missing | Available | Available | Partial | Yes | P0 | **BUILD NOW** |
| Validation with error report | Missing | Available | Available | Partial | Yes | P0 | **BUILD NOW** |
| Duplicate detection | Missing | Available | Partial | Partial | Yes | P0 | **BUILD NOW** |
| Import history | DB table only | Available | Available | Missing | Yes | P0 | **BUILD NOW** |
| Partial import (skip errors) | Missing | Available | Available | Missing | Yes | P0 | **BUILD NOW** |
| Template download | Missing | Available | Available | Available | Yes | P0 | **BUILD NOW** |
| Import background processing | Missing | Available | Available | Missing | Yes | P0 | **BUILD NOW** |

---

## Documents

| Capability | Our HRMS | Horilla | Frappe HR | OrangeHRM | Needed | Priority | Decision |
|---|---|---|---|---|---|---|---|
| Document types | Basic | Available | Available | Available | Yes | P0 | **BUILD NOW** |
| Document upload | Basic | Available | Available | Available | Yes | P0 | **BUILD NOW** |
| Document verification | Missing | Available | Available | Available | Yes | P0 | **BUILD NOW** |
| Document expiry tracking | Missing | Available | Available | Available | Yes | P1 | **BUILD LATER** |
| Document versioning | Missing | Partial | Available | Missing | No | P3 | **BUILD LATER** |
| Access control on documents | Missing | Available | Available | Available | Yes | P0 | **BUILD NOW** |
| Document request workflow | Missing | Available | Partial | Missing | Yes | P0 | **BUILD NOW** |

---

## Attendance

| Capability | Our HRMS | Horilla | Frappe HR | OrangeHRM | Needed | Priority | Decision |
|---|---|---|---|---|---|---|---|
| Attendance logs | Basic | Mature | Mature | Mature | Yes | P0 | **BUILD NOW** |
| Shift management | Basic | Mature | Mature | Available | Yes | P0 | **BUILD NOW** |
| Holiday management | Basic | Available | Available | Available | Yes | P0 | **BUILD NOW** |
| ESSL biometric integration | Missing | Generic biometric | Available | Missing | Yes | P0 | **INTEGRATE** — Phase 1 |
| Attendance provider abstraction | Missing | Partial | Partial | Missing | Yes | P0 | **BUILD NOW** |
| OD management | Missing | Missing | Available | Missing | Yes | P0 | **BUILD NOW** — India-specific |
| WFH management | Missing | Via work type | Available | Missing | Yes | P0 | **BUILD NOW** — India-specific |
| Comp-off earn/use | Missing | Missing | Available | Missing | Yes | P0 | **BUILD NOW** — India-specific |
| Attendance regularization | Basic | Available | Available | Available | Yes | P0 | **BUILD NOW** |
| Attendance approval workflow | Missing | Available | Available | Available | Yes | P0 | **BUILD NOW** |
| Attendance reprocessing | Missing | Unknown | Available | Missing | Yes | P0 | **BUILD NOW** — India-specific |
| Late/Early tracking | Missing | Available | Available | Available | Yes | P0 | **BUILD NOW** |
| LOP calculation | Missing | Available | Available | Available | Yes | P0 | **BUILD NOW** |

---

## Leave

| Capability | Our HRMS | Horilla | Frappe HR | OrangeHRM | Needed | Priority | Decision |
|---|---|---|---|---|---|---|---|
| Leave types | Basic | Configurable | Configurable | Configurable | Yes | P0 | **CONFIGURE** — make configurable |
| Leave policies | Missing | Available | Mature | Available | Yes | P0 | **BUILD NOW** |
| Leave accrual | Missing | Available | Mature | Available | Yes | P0 | **BUILD NOW** |
| Leave balance | Missing | Available | Mature | Available | Yes | P0 | **BUILD NOW** |
| Carry-forward rules | Missing | Available | Available | Available | Yes | P0 | **BUILD NOW** |
| Leave encashment | Missing | Available | Available | Available | Yes | P1 | **BUILD LATER** |
| Leave approval workflow | Basic | Available | Mature | Available | Yes | P0 | **BUILD NOW** |
| Leave calendar | Missing | Available | Available | Available | Yes | P0 | **BUILD NOW** |
| Half-day leave | Missing | Available | Available | Available | Yes | P0 | **BUILD NOW** |
| Sandwich rule | Missing | Available | Available | Missing | Yes | P0 | **BUILD NOW** |
| LOP calculation | Missing | Available | Available | Available | Yes | P0 | **BUILD NOW** |
| Maternity/Paternity leave | Missing | Available | Available | Available | Yes | P0 | **BUILD NOW** |

---

## Payroll

| Capability | Our HRMS | Horilla | Frappe HR | OrangeHRM | Needed | Priority | Decision |
|---|---|---|---|---|---|---|---|
| Salary components | Basic | Available | Mature | Available | Yes | P0 | **BUILD NOW** |
| Salary structures | Basic | Contract-based | Available | Available | Yes | P0 | **BUILD NOW** |
| Payroll runs | Basic | Available | Mature | Available | Yes | P0 | **BUILD NOW** |
| Attendance integration | Missing | Available | Mature | Available | Yes | P0 | **BUILD NOW** |
| LOP deduction | Missing | Available | Available | Available | Yes | P0 | **BUILD NOW** |
| Payslip generation | Basic | Available | Mature | Available | Yes | P0 | **BUILD NOW** |
| Salary advances | Missing | Loan module | Available | Missing | Yes | P0 | **BUILD NOW** |
| Arrears | Missing | Missing | Available | Missing | Yes | P0 | **BUILD NOW** |
| Payroll lock/finalization | Missing | Missing | Available | Missing | Yes | P0 | **BUILD NOW** |
| Payroll variance analysis | Missing | Missing | Partial | Missing | Yes | P0 | **BUILD NOW** |
| Payroll reversal | Missing | Missing | Partial | Missing | Yes | P1 | **BUILD LATER** |
| PAN / TDS (India) | PAN field only | Missing | Available | Missing | Yes | P0 | **BUILD NOW** |
| New Tax Regime (India) | Missing | Missing | Available | Missing | Yes | P1 | **BUILD LATER** |
| PF / ESIC (India) | UAN/PF fields only | Missing | Available | Missing | Yes | P0 | **BUILD NOW** |
| Statutory payroll (India) | Missing | Missing | Available | Missing | Yes | P1 | **BUILD LATER** |
| Payslip PDF | Missing | Available | Available | Available | Yes | P0 | **BUILD NOW** |
| Multi-currency | Missing | Available | Available | Missing | No | P4 | **REJECT** |

---

## Performance

| Capability | Our HRMS | Horilla | Frappe HR | OrangeHRM | Needed | Priority | Decision |
|---|---|---|---|---|---|---|---|
| Performance cycles | Missing | Available | Available | Available | Yes | P1 | **BUILD LATER** |
| Goals / KPIs | Missing | OKR-based | Available | Available | Yes | P1 | **BUILD LATER** |
| Self-review | Missing | Available | Available | Available | Yes | P1 | **BUILD LATER** |
| Manager review | Missing | Available | Available | Available | Yes | P1 | **BUILD LATER** |
| Ratings | Missing | Available | Available | Available | Yes | P1 | **BUILD LATER** |
| 360 feedback | Missing | Available | Partial | Partial | No | P3 | **RESEARCH** |
| PIP | Missing | Available | Available | Available | Yes | P1 | **BUILD LATER** |

---

## Recruitment

| Capability | Our HRMS | Horilla | Frappe HR | OrangeHRM | Needed | Priority | Decision |
|---|---|---|---|---|---|---|---|
| Manpower requisition | Missing | Missing | Available | Missing | Yes | P2 | **BUILD LATER** |
| Job postings | Basic | Available | Available | Available | Yes | P2 | **BUILD LATER** |
| Kanban pipeline | Missing | Available | Available | Partial | Yes | P2 | **BUILD LATER** |
| Interview scheduling | Missing | Available | Available | Available | Yes | P2 | **BUILD LATER** |
| Candidate → Employee conversion | Missing | Available | Available | Available | Yes | P2 | **BUILD LATER** |

---

## Administration & Operations

| Capability | Our HRMS | Horilla | Frappe HR | OrangeHRM | Needed | Priority | Decision |
|---|---|---|---|---|---|---|---|
| Approval center | Basic inbox | Partial | Available | Available | Yes | P0 | **BUILD NOW** |
| HR task center | Missing | Missing | Missing | Missing | Yes | P0 | **BUILD NOW** |
| Notification center | Missing | Available | Available | Available | Yes | P0 | **BUILD NOW** |
| HR calendar | Missing | Available | Available | Partial | Yes | P1 | **BUILD LATER** |
| Data quality center | Missing | Missing | Missing | Missing | Yes | P0 | **BUILD NOW** — differentiation |
| Global search | Missing | Available | Available | Available | Yes | P1 | **BUILD LATER** |
| Asset management | Missing | Available | Available | Available | Medium | P2 | **BUILD LATER** |
| Help desk | Missing | Available | Missing | Missing | No | P4 | **REJECT** |
| Reports engine | Basic | Available | Mature | Available | Yes | P0 | **BUILD NOW** |
| Scheduled reports | Missing | Missing | Available | Missing | No | P3 | **BUILD LATER** |
| Feature flags | Missing | Missing | Missing | Missing | Yes | P1 | **BUILD LATER** |

---

## Summary: Build Priority Table

### BUILD NOW (Phase 1 — September 2026)
Employee upgrade, User management, Data scopes, Lifecycle events, Probation, Confirmation, Onboarding engine (mature), Bulk import engine, Document management, Attendance foundation, ESSL integration, OD/WFH/Comp-off, Leave engine, Payroll Part 1, TDS/PF basics, Approval center, HR task center, Notification center, Data quality center, Reports foundation.

### BUILD LATER (Phase 2 — December 2026)
Performance cycles, PIP, Skills matrix, Indian statutory payroll, New Tax Regime, Leave encashment, Payroll reversal, HR calendar, Global search, Org chart, Feature flags.

### BUILD LATER (Phase 3 — January 2027)
Recruitment, Transfer, Promotion, Effective-dating history, Scheduled reports, Asset management (full).

### REJECT
Help desk, Multi-currency payroll, SSO/OAuth (short-term), CRM integration.
