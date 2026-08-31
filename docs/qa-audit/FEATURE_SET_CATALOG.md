# Comprehensive Feature Set Documentation - HRMS Portal

This document details the complete feature set currently implemented across the **HRMS Enterprise Platform**, covering frontend UI modules, backend engines, security protocols, and system-wide design customizers.

---

## 1. Dynamic Theme Engine & Corporate Brand Customizer
* **Appearance Modes**:
  * **Obsidian Dark Console Mode**: Sleek slate surfaces (`#0B0F19` base, `#111827` cards) optimized for high-density enterprise operations.
  * **Light Mode**: Clean slate background (`#F8FAFC`) with crisp white card surfaces (`#FFFFFF`).
  * **System Mode**: Automatically syncs with operating system color preferences.
* **HTML5 Canvas Corporate Logo Sampler**:
  * Drag-and-drop or click logo upload (PNG, JPEG, SVG).
  * Auto-downscaling & RGB quantization extracting top 5 dominant corporate brand colors.
  * One-click primary accent assignment from extracted swatches.
* **Enterprise Presets**:
  * *Obsidian Cobalt* (`#2563EB`)
  * *Electric Cyan* (`#06B6D4`)
  * *Emerald Velvet* (`#10B981`)
  * *Royal Violet* (`#8B5CF6`)
  * *Sunset Amber* (`#F59E0B`)
* **Custom Color Fine-Tuning**:
  * Live Hex color pickers for Primary Accent and Secondary Accent.
  * Real-time CSS Custom Property injection updating page containers, cards, active navigation states, badges, and progress bars.

---

## 2. Dashboard & Analytics Engine
* **KPI Metrics Widgets**: Real-time summary cards for Active Headcount, Daily Attendance Rate, Pending Action Items, and Monthly Payroll Liability.
* **Interactive Data Visualizations**: Recharts-driven charts for headcount distribution by department, monthly attendance trends, and leave balances.
* **Quick Actions Toolbar**: Direct shortcuts to apply for leave, mark check-in/out, view payslips, or approve pending requests.
* **Recent Activity Feed**: Live log of organization events, new employee onboarding, and policy announcements.

---

## 3. Universal Inbox & Approval Workflow Center
* **Unified Request Queue**: Single destination for all cross-departmental approval tasks (Leave applications, Attendance regularizations, Document sign-offs).
* **Status Badges & Filtering**: Filter by `Pending`, `Approved`, `Rejected`, and `Escalated`.
* **Inline Action Modal**: Quick review drawer with manager decision buttons (Approve/Reject) and mandatory audit comment fields.

---

## 4. HR Task Center
* **Operational Workflows**: Structured task board for HR admins to manage employee onboarding checklists, offboarding clearances, and statutory submission deadlines.
* **Priority & SLA Tracking**: Priority tags (`High`, `Medium`, `Low`), due dates, and SLA breach warnings.

---

## 5. Employee Directory & Profile Console (`People`)
* **Directory Grid & Table**: High-density employee directory with search bar (Name, ID, Email, Role) and multi-level filters (Department, Designation, Location, Employment Type).
* **Obsidian Employee Profile Console**:
  * **Overview Tab**: Key employee metrics, manager reporting hierarchy, quick contact details.
  * **Personal Tab**: Personal information, date of birth, blood group, emergency contact details.
  * **Work Info Tab**: Employment details, date of joining, probation status, official email, department, designation, and location.
  * **Statutory Tab**: Government identifiers (PAN, Aadhaar, UAN/PF, ESIC) and Bank Account details (Bank Name, Account Number, IFSC Code).
  * **Documents Tab**: Secure upload, storage, and preview of employee identity documents, offer letters, and experience certificates.
  * **Timeline Tab**: Immutable historical audit trail of promotions, transfers, designation shifts, and status changes.
  * **Offboarding Tab**: Notice period tracking, exit interview feedback notes, clearance status across IT, Finance, and HR.

---

## 6. Leave Management Engine
* **Normalized 4-Category Balances**:
  * **PL (Privilege Leave / Annual Leave)**: Accrual & balance tracking.
  * **CL (Casual Leave)**: Short-notice time-off tracking.
  * **SL (Sick Leave)**: Medical leave tracking with document attachment options.
  * **LWP (Leave Without Pay)**: Unpaid leave tracking feeding directly into Loss of Pay (LOP) payroll calculations.
* **Leave Application Form**: Date picker range, leave type selector, half-day / full-day toggle, reason text area, and supporting document upload.
* **Policy Rules Matrix**: Configurable rules for encashment eligibility, max carry-forward limits, and consecutive day caps.

---

## 7. Attendance & Time Tracking
* **Self-Service Check-In / Check-Out**: Single-click check-in/out button with precise timestamp recording and shift duration counters.
* **Attendance Regularization**: Request correction for missed punch-ins/outs with justification.
* **Admin Roster**: Comprehensive daily attendance roster showing on-time arrivals, late marks, half-days, and absences.

---

## 8. Payroll & Statutory Engine
* **Salary Structure Configurator**: Breakdown of Basic Pay, House Rent Allowance (HRA), Special Allowance, Provident Fund (PF) contribution, Employee State Insurance (ESI), and Tax Deducted at Source (TDS).
* **LOP Payroll Calculator**: Automated Loss of Pay deduction calculation derived directly from approved `LWP` leave days.
* **Payslip Generator**: Instant generation of monthly payslips with PDF download and breakdown preview.
* **Statutory Reporting**: Pre-formatted exports for PF ECR statements, ESI returns, and Form 16 TDS data.

---

## 9. Performance Management System (PMS)
* **Review Cycle Management**: Creation and tracking of Quarterly and Annual Performance Review cycles.
* **KPI & Goal Tracking**: Goal setting, target completion percentages, and milestone tracking.
* **Self & Manager Evaluation**: Dual-scoring rubric for employee self-appraisal and manager performance rating.

---

## 10. Recruitment & ATS Pipeline
* **Job Requisition Management**: Active job posting management with department, location, and headcount targets.
* **Candidate Kanban Board**: Visual hiring pipeline (Sourced $\rightarrow$ Screened $\rightarrow$ Interview Scheduled $\rightarrow$ Offer Extended $\rightarrow$ Hired / Rejected).
* **Interview Feedback**: Candidate rating forms and interviewer notes.

---

## 11. Employee Self-Service (ESS) & Helpdesk
* **Ticketing System**: Submit service requests for IT Assets, Payroll Queries, HR Clarifications, and Facility Services.
* **Status Updates**: Real-time ticket tracking with resolution comments and priority tags.

---

## 12. Organization Structure & Hierarchy
* **Department & Designation Setup**: Manage corporate department lists, designation tiers, and reporting lines.
* **Branch / Location Management**: Configure multiple office locations and work-from-home policies.

---

## 13. Data Quality & System Audit Engine
* **Missing Data Scanner**: Automated flags for profiles missing PAN, Aadhaar, Bank Details, or Emergency Contacts.
* **Audit Log Trail**: Full system audit log recording timestamp, user ID, IP address, and details for every create/update/delete operation.

---

## 14. Bulk Operations & Data Importer
* **Template Generator**: Downloadable CSV/Excel templates for Employee Data, Attendance Logs, and Leave Balances.
* **Bulk Upload Engine**: High-speed data processing with pre-upload validation and row-by-row error reporting.

---

## 15. Security, Authentication & Role-Based Access Control (RBAC)
* **JWT Token Security**: Bearer token authorization with automatic header injection and session protection.
* **Role Hierarchy**:
  * `SUPER_ADMIN`: Full portal control, system configurations, audit logs.
  * `HR_ADMIN`: Employee management, payroll processing, recruitment, policy configuration.
  * `MANAGER`: Department team oversight, leave & attendance approvals, performance reviews.
  * `EMPLOYEE`: Self-service check-in, leave application, payslip download, profile view.
* **Backend Stack**: Built on high-performance Go REST microservices with PostgreSQL persistence.
