# Live Application Data Overview — HRMS Enterprise Portal

This document presents the visual breakdown and raw data captured directly from the live application running on `http://localhost:5173`.

---

## 1. Summary of Live Portal Data

### 👥 1. Employee Directory (`/employees`)
- **Total Headcount**: 50 Employees (45 Active, 5 Onboarding)
- **Key Fields Tracked**: Employee ID, Full Name, Work Email, Department, Designation, Location, Probation Status, Joining Date.

### ⏱️ 2. Attendance Console (`/attendance`)
- **Date Under Inspection**: 08/31/2026
- **Status Breakdown**:
  - `Alice Walker` — Present (On-time 09:00 AM check-in)
  - `Bob Smith` — Late arrival (09:42 AM check-in)
  - `Charlie Day` — Absent / Missed Punch

### 🌴 3. Leave Engine (`/leave`)
- **Normalized Balances**:
  - **PL (Privilege Leave)**: 15.0 Days
  - **CL (Casual Leave)**: 9.0 Days
  - **SL (Sick Leave)**: 8.0 Days
  - **LWP (Leave Without Pay)**: 0.0 Days
- **Application History**: Paid & Unpaid requests logged with approval workflows.

### 💰 4. Payroll Engine (`/payroll`)
- **State Machine Status**: `VALIDATED`
- **Total Monthly Outflow**: ₹41,20,000.00
- **Active Payslips**: 128
- **LWP Days Deducted**: 12.5 Days
- **Advances Deducted**: ₹45,000.00

### 🎯 5. ATS & Recruitment Pipeline (`/recruitment`)
- **Active Requisitions**:
  - Senior Frontend Engineer (Target: 2)
  - Product Manager (Target: 1)
- **Candidate Pipeline**:
  - `Rahul Sharma` — Applied
  - `Priya Patel` — Interviewing
  - `Amit Kumar` — Offer Extended

### 📋 6. HR Task Center (`/tasks`)
- **Active Items**:
  - Probation Confirmation Review
  - Compliance Document Approvals
  - Attendance Anomaly Checks

### 📬 7. Universal Approval Inbox (`/workflow`)
- **Pending Actions**: 0 Items (Inbox Zero - All requests processed)

### 🏢 8. Organization Setup (`/organization`)
- **Branches**: Headquarters (Mumbai, India)
- **Departments**: Engineering, HR, Finance, Sales, Marketing, Operations, IT Support, Administration.
