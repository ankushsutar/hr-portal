# Enterprise HRMS — UX Guidelines & Interaction Principles

This document specifies the user experience principles, user journeys, interaction patterns, feedback mechanisms, and accessibility guidelines for the **Enterprise HRMS Platform**.

---

## 1. Core UX Principles

1. **Information Velocity**: Reduce clicks to complete daily operational HR tasks. Common actions (e.g. approving leave, clocking attendance, downloading payslips, fixing missing employee bank data) should be reachable in 1–2 clicks.
2. **Context Retention**: Use inline popups, drawer modals, and side-sheet panels rather than hard page redirects whenever possible.
3. **Proactive Feedback**: Every action (approve, reject, lock payroll, trigger import, export report) must provide immediate feedback via toasts, state indicators, or mutation progress bars.
4. **Predictable Navigation**: Persistent top header breadcrumbs (`console > module > sub-view`) and command shortcuts (`⌘K`) ensure users never lose context.
5. **Fail-Safe Design**: Destructive actions (e.g. rejecting leave, locking payroll runs, terminating employee access) require explicit audit remarks or confirmation dialogs.

---

## 2. Key User Journeys

### A. Employee Self-Service Journey
```
[ Login ] ➔ [ Dashboard ] ➔ [ My Attendance Punch / Apply Leave ] ➔ [ Inbox Feedback & Notifications ]
```
- **Clock In / Out**: Instant one-click punch from top header or `My Attendance` view.
- **Leave Application**: View active balance summary, select leave type, specify dates, and submit.
- **Payslip Download**: Access published payslips under `Payroll` and open printable payslip view.

### B. Manager Approval Journey
```
[ Notification / Universal Inbox ] ➔ [ Filter Module (Leave / WFH / Advance) ] ➔ [ Select Multi-Items ] ➔ [ Bulk Approve / Reject ]
```
- Universal Inbox consolidates all team requests into a single data grid with high/normal priority tags.

### C. HR Operations Journey
```
[ HR Task Center / Data Quality ] ➔ [ Identify Anomaly (e.g. Missing PAN) ] ➔ [ Click "Resolve" ] ➔ [ Edit Employee Master ]
```
- Proactively audits database health (missing manager, missing bank account/PAN, duplicate email alias) and provides click-through shortcuts to fix errors.

### D. Payroll Admin Journey
```
[ Payroll Dashboard ] ➔ [ Process Run ] ➔ [ Validate LOP & Advances ] ➔ [ Approve & Lock Run ] ➔ [ Publish Payslips ]
```
- State machine stepper visually guides the payroll administrator through all calculation stages.

---

## 3. UI Patterns & Interaction Standards

### Command Palette (`⌘K`)
- Triggered via top search bar input or `⌘K` keyboard shortcut.
- Fast fuzzy navigation across all 15 HR modules and employee directory records.

### Notification Drawer
- Header bell icon displays pulse indicator for unread system alerts.
- Clicking bell opens an in-header popover listing actionable notifications with module tags.

### Empty, Loading & Error States
- **Loading State**: Monospace skeleton loaders or dark spinner indicators (`Loading operational queue...`).
- **Empty State**: Zero-state container with emerald check icon (`Inbox Zero - All requests processed`).
- **Error State**: Rose alert box displaying backend error message with retry trigger.
