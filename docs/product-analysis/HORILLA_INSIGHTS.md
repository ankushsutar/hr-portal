# Horilla HRMS — Product Insights

> **Research basis:** Public documentation (docs.horilla.com), feature pages (horilla.com/features), public GitHub repository, authenticated demo observation (partial — browser quota exhausted), and established HRMS domain knowledge.
> Source type is noted for each observation.

---

## What We Studied

| Source | Coverage |
|---|---|
| `docs.horilla.com` | Full module documentation |
| `horilla.com/features` | Feature marketing overview |
| `github.com/horilla-opensource/horilla` | Architecture, models |
| Authenticated demo | Partially explored (attendance dashboard reached) |
| HRMS domain knowledge | Cross-referenced for workflow patterns |

---

## Navigation Patterns

**Observation (Public Docs):** Horilla organizes navigation into top-level modules with flat sub-pages:
- Recruitment → Resume Shortlisting → Candidates → Stages → Interview → Survey → Skill Zone
- Employee → Profile → Document Request → Shift Request → Work Type Request → Disciplinary Action → Org Chart
- Payroll → Contract → Allowance → Deduction → Payslip → Loan → Reimbursement → Encashments → Federal Tax
- Attendance → (logs, biometric sync, regularization)
- Leave → (types, balances, calendar)
- Performance → (OKR, 360 feedback, review cycles)
- Asset → (allocation, return, tracking)
- Offboarding → (clearance, exit)
- Help Desk → (tickets)

**Problem solved:** Organizing 10+ HR domains without overwhelming users.

**Why it works:** Module-first navigation gives HR users a clear home for each task. Modules map to HR job responsibilities.

**Our adaptation:** Adopt the same module grouping but restructure navigation around **Employee Lifecycle** as the organizing principle, not isolated modules. Add a "My Workspace" self-service area for employees.

**What we should change:** Horilla's navigation appears flat per-module. We should add cross-cutting views (e.g. Approval Center, HR Task Center, Calendar) that cut across modules.

**Priority:** P0

---

## Employee Management

**Observation (Public Docs):** Horilla's Employee module includes:
- Full profile with personal, professional, work info sections
- Document request system
- Shift requests and rotating shift assignments
- Work type requests (WFH, etc.)
- Disciplinary actions
- Organization chart
- Policies

**Problem solved:** Centralizing all employee data in one profile.

**Why it works:** The profile acts as the single source of truth. HR doesn't need to jump between modules to see an employee's shift, documents, and work type.

**Our adaptation:** Build a rich employee profile with tabs: Overview, Work Info, Documents, Timeline, Payroll, Attendance, Leave, Performance.

**What we should change:** Add an **Employee Lifecycle Timeline** tab that Horilla appears to lack — showing all lifecycle events (joined, probation, confirmed, promoted, etc.) in chronological order.

**Priority:** P0

---

## Onboarding

**Observation (Public Docs):** Horilla has an onboarding module documented as transitioning employees from recruitment to full integration. The docs index shows onboarding as a standalone module section.

**Problem solved:** Structured transition from new hire to productive employee.

**Why it works:** Templates allow HR to define the standard process once and reuse it per hire.

**Our adaptation:** Build a configurable **Onboarding Engine** with templates, tasks, document checklists, and owner role assignments. Support bulk onboarding for the common scenario where multiple employees join simultaneously.

**What we should change:** Add dependency between tasks (e.g. "Create email" before "Issue laptop"), and automated status notifications.

**Priority:** P0

---

## Attendance

**Observation (Public Features page):** Horilla attendance includes:
- Check-in/check-out tracking
- Hour account (overtime management)
- Late come/early out detection
- Biometric sync
- Activity log
- Mobile punch
- Geo-fencing

**Problem solved:** Accurate daily attendance recording from multiple input sources.

**Why it works:** Biometric integration (ESSL-compatible) feeds raw data; the system normalizes it into attendance transactions.

**Our adaptation:** Design an `AttendanceProvider` abstraction so ESSL, CSV, manual, and future API sources are interchangeable. Raw biometric logs must never be overwritten — always processed into derived records.

**What we should change:** Explicitly support attendance **reprocessing** (re-run attendance logic for a date range when shift or policy changes). Horilla's reprocessing capability is unclear.

**Priority:** P0

---

## Leave

**Observation (Public Features page):** Horilla leave includes:
- Custom leave types
- Approval workflows
- Balance tracking
- Calendar view
- Carry-forward

**Problem solved:** Policy-compliant leave management with manager approval.

**Why it works:** Configurable leave types remove the need for code changes when policy changes.

**Our adaptation:** Build fully configurable leave policies: accrual, carry-forward, encashment, sandwich rule, half-day, LOP. Also add Indian-specific leave types: Maternity, Paternity, Comp-off, OD, WFH.

**What we should change:** Add leave impact on attendance and LOP calculation feeding directly into payroll.

**Priority:** P0

---

## Payroll

**Observation (Public Docs):** Horilla payroll includes:
- Contract management
- Allowances and deductions
- Tax calculation (Federal Tax — not India-specific)
- Payslip generation
- Multi-currency
- Loan / Advanced Salary
- Reimbursements
- Encashments

**Problem solved:** Automated salary calculation from attendance data.

**Why it works:** Contract-based payroll ensures each employee has defined earnings structure.

**Our adaptation:** Build an Indian-specific payroll engine with: PAN, Aadhaar-related payroll data, UAN, PF, ESIC, TDS, New Tax Regime, arrears, advances. Horilla's "Federal Tax" is not aligned to Indian statutory requirements.

**What we should change:** We need India-specific tax computation — Horilla's payroll is generic/global. This is our key differentiator.

**Priority:** P0 (basic), P1 (Indian statutory)

---

## Recruitment

**Observation (Public Features page + Docs):** Horilla recruitment includes:
- Job postings
- Kanban pipeline view
- Interview scheduling
- Email templates
- Application forms
- Resume shortlisting
- Stages (configurable)
- Skill Zone (candidate skill tagging)
- Candidate self-tracking portal
- Survey & open jobs

**Problem solved:** Full hiring pipeline from job posting to candidate selection.

**Why it works:** Kanban pipeline gives recruiters a visual view of candidate flow across stages.

**Our adaptation:** Build recruitment in Phase 3. Key patterns to adopt: kanban pipeline, configurable stages, interview scheduling, candidate → employee conversion without data duplication.

**What we should change:** Add manpower requisition approval before job posting; connect to workforce planning.

**Priority:** P2 (Phase 3)

---

## Performance

**Observation (Public Features page):** Horilla performance includes:
- OKR tracking
- 360-degree feedback
- Review cycles
- Goal alignment

**Problem solved:** Structured performance evaluation replacing ad-hoc annual reviews.

**Our adaptation:** Build in Phase 2: cycles, goals, KPI, KRA, self review, manager review, ratings. Keep architecture compatible with OKRs and 360 feedback for Phase 3.

**Priority:** P1 (Phase 2)

---

## Asset Management

**Observation (Public Docs):** Horilla has an Asset module: allocation, tracking, return, condition.

**Problem solved:** Company asset lifecycle management tied to employee records.

**Our adaptation:** Research needed — but basic asset management (laptop, access card) integrated with onboarding and exit is needed. Full asset inventory can be deferred.

**Priority:** P2 — integrate with onboarding/exit only initially

---

## Help Desk

**Observation (Public Docs):** Horilla includes a Help Desk module for internal HR tickets.

**Problem solved:** Employee HR queries without going to HR directly.

**Our adaptation:** **REJECT** for now. Our focus is core HR operations. Employees can contact HR through existing channels. Can be added in a future phase.

**Priority:** REJECT

---

## UX Patterns

**Observation (Docs + Domain Knowledge):**

### Flexible Views
- Horilla supports both list and Kanban views — a key differentiator for recruitment and task management.

### Advanced Filters
- Filters appear as filter bars above tables, allowing column-specific filtering.

### Bulk Actions
- Mass update, import, export, deletion — available across modules.

### Role-Based Access
- Permissions and activity tracking.

**Our adaptation:** Implement list/kanban/calendar view toggles for modules where it adds value (Recruitment: Kanban, Attendance: Calendar, Onboarding: List+Progress).

---

## Useful Patterns for Our HRMS

| Pattern | Problem Solved | Our Adaptation | Priority |
|---|---|---|---|
| Module-based navigation | HR role clarity | Adopt with lifecycle emphasis | P0 |
| Configurable leave types | Policy flexibility | Build configurable leave engine | P0 |
| Contract-based payroll | Salary structure | Indian salary structure approach | P0 |
| Kanban recruitment pipeline | Visual candidate tracking | Phase 3 recruitment | P2 |
| Biometric sync abstraction | Multi-source attendance | AttendanceProvider pattern | P0 |
| Document request per employee | Document completeness | Document checklist engine | P0 |
| Onboarding templates | Repeatable new-hire process | Configurable templates | P0 |
| Bulk operations across modules | HR efficiency at scale | Universal bulk-ops framework | P0 |
| Org chart | Hierarchy clarity | Interactive org chart | P1 |
| Skill zone | Talent mapping | Phase 2 skills matrix | P1 |
| Self-tracking portal | Employee autonomy | My Workspace self-service | P0 |

---

## Patterns We Will NOT Adopt

| Pattern | Reason |
|---|---|
| Help Desk module | Not needed for core HR; deferred indefinitely |
| CRM integration | Out of scope for HRMS |
| Multi-currency payroll | India-only initially; single currency |
| Federal/global tax | We need India-specific TDS/New Regime |
| Exact Horilla UI layout | We have our own design system |
| Horilla's Django/Python stack | We are Go + React |

---

## Product Opportunities (Where We Can Exceed Horilla)

1. **Indian Payroll Engine** — Horilla's payroll is generic. We build India-first: TDS, New Regime, PF, ESIC, Aadhaar-related, UAN, statutory compliance.
2. **ESSL Native Integration** — Horilla has "biometric sync" generically; we build a first-class ESSL adapter.
3. **Employee Lifecycle Timeline** — A dedicated timeline of all lifecycle events per employee; Horilla lacks this as a first-class feature.
4. **Attendance Reprocessing** — Ability to re-run attendance logic for a date range; critical for Indian operations.
5. **OD/WFH/Comp-off as First-Class Concepts** — Indian work patterns; treated as distinct attendance types with proper workflow.
6. **Data Quality Center** — Dashboard showing missing data, expired documents, etc. Proactive HR operations.
7. **Probation Dashboard** — Dedicated view with 30/15/7 day countdown; automated confirmation workflow.
8. **Bulk HR Operations Framework** — A unified bulk operation pattern across all modules.
