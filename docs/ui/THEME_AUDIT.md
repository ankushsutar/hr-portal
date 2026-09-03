# HRMS Portal — Comprehensive Theme & UI Audit Report

**Date**: September 3, 2026  
**Auditor**: Senior UI/UX & Frontend Architect  
**Scope**: Full HRMS Enterprise Portal Frontend (`frontend/src`)

---

## 1. Existing Theme Architecture Overview

- **Theme Management**: Managed via Zustand store (`src/stores/themeStore.ts`).
- **Persistence**: Persists in `localStorage` under key `hrms_theme_config`.
- **Modes**: Supports `dark`, `light`, and `system`.
- **CSS Strategy**: Tailwind CSS v4 (`@import "tailwindcss";`) + CSS custom properties in `src/index.css`.
- **Root State**: Toggles `.dark` class on `document.documentElement` (`root`) and sets inline CSS variables (`--color-primary`, `--color-accent`, `--bg-page`, `--bg-card`, `--bg-sidebar`, `--bg-header`, `--border-color`, `--text-main`, `--text-muted`).

---

## 2. Categorized Findings & Vulnerabilities

### Category A: Theme-Aware Components
- `src/components/ui/Layout.tsx`: Partial adoption of CSS variables (`var(--bg-page)`, `var(--bg-sidebar)`, `var(--text-main)`, `var(--text-muted)`).
- `src/components/ui/Card.tsx`: Uses `bg-[var(--bg-card)]` and `border-[var(--border-color)]`, but relies on brittle regex replacements for child classes.

### Category B: Hardcoded & Theme-Breaking Components (CRITICAL)
- **Problem**: Almost **every feature component** across `src/features/` hardcodes dark mode utility classes (`bg-[#111827]`, `bg-[#0B0F19]`, `bg-slate-900`, `bg-slate-800`, `border-slate-800`, `text-slate-100`, `text-slate-200`, `text-slate-400`).
- **Impact**: Switching to Light Mode leaves the page dark or creates broken visual contrast (white background with white cards, dark boxes on light backgrounds, invisible text).

#### Affected Features:
1. `src/features/dashboard/MainDashboard.tsx`: Hardcoded `bg-[#111827]`, `bg-[#0B0F19]`, `border-slate-800`.
2. `src/features/employees/` (`EmployeeDirectory.tsx`, `EmployeeProfile.tsx`, `AddEmployeeModal.tsx`, `OnboardingDashboard.tsx`): Hardcoded dark slate backgrounds.
3. `src/features/payroll/` (`PayrollDashboard.tsx`, `SalaryMatrixConsole.tsx`, `PayslipView.tsx`): Hardcoded dark backgrounds, hardcoded card colors.
4. `src/features/attendance/` (`AttendanceDashboard.tsx`, `MyAttendance.tsx`, `AttendanceValidation.tsx`, `MonthlySummaryConsole.tsx`, `ExceptionQueue.tsx`, `QuickPunchWidget.tsx`): Hardcoded dark cards and tables.
5. `src/features/leave/` (`LeaveDashboard.tsx`, `LeaveApplicationForm.tsx`, `LeaveEncashmentConsole.tsx`, `LeavePolicyManager.tsx`): Hardcoded dark modals and cards.
6. `src/features/performance/PerformanceDashboard.tsx`: Hardcoded dark cards & stat widgets.
7. `src/features/recruitment/` (`RecruitmentDashboard.tsx`, `CandidatePipeline.tsx`): Hardcoded dark kanban boards and candidate cards.
8. `src/features/workflow/` (`HRTaskCenter.tsx`, `PendingApprovals.tsx`, `ApprovalTimeline.tsx`): Hardcoded dark timelines and lists.
9. `src/features/lifecycle/` (`ProbationDashboard.tsx`, `ExitDashboard.tsx`, `EmployeeServices.tsx`, `ServiceRequestForm.tsx`): Hardcoded dark service forms.
10. `src/features/admin/` (`Users.tsx`, `SecurityAuditConsole.tsx`, `OnboardingTemplates.tsx`, `DocumentTypes.tsx`): Hardcoded dark security/user tables.
11. `src/features/organization/` (`OrganizationList.tsx`, `Designations.tsx`): Hardcoded dark list views.
12. `src/features/reports/` (`ReportsDashboard.tsx`, `DataQualityCenter.tsx`): Hardcoded dark chart containers.
13. `src/features/import/` (`BulkImportWizard.tsx`, `ImportHistory.tsx`): Hardcoded dark wizard steps.
14. `src/features/helpdesk/HelpdeskConsole.tsx`: Hardcoded dark ticket lists.

### Category C: Duplicate & Inconsistent Styling
- Lack of centralized semantic tokens for elevated surfaces, input backgrounds, subtle hovers, and status badges.
- Random color usages: `#0B0F19`, `#111827`, `#1E293B`, `bg-slate-900/80`, `bg-slate-800/40`, `bg-blue-500/10`.

### Category D: Accessibility & Contrast
- Hardcoded dark gray text (`text-slate-400`, `text-slate-500`) does not maintain proper contrast ratios when switched to Light mode.
- Focus outlines are inconsistent across forms and interactive controls.

### Category E: Theme Customizer Isolation
- The `ThemeCustomizerModal.tsx` allows customizing Primary Accent (`primaryColor`), Secondary Accent (`accentColor`), and Presets, but components throughout the application do not listen to or use the primary/secondary custom variables consistently.

---

## 3. Audit Summary Statistics

| Category | Item Count | Status |
|---|---|---|
| Hardcoded Dark Utility Files | 48 | Needs Refactoring to Design Tokens |
| UI Components needing theme variables | 54 | Needs Token Standard |
| System Mode OS Preference Listener | Partial | Needs Live Media Query Listener |
| Theme Persistence | Exists | Verified (`localStorage`) |
