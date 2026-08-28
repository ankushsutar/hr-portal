---
version: "1.0"
product: "HRMS"
created: "2026-08-28"
atmosphere: "Professional · Calm · Operational · Data-dense · Trustworthy"
stack:
  frontend: "React 19 + TypeScript + Vite + Tailwind CSS v4"
  ui_primitives: "Radix UI"
  table: "TanStack Table"
  routing: "TanStack Router"
  server_state: "TanStack Query"
---

# DESIGN.md — HRMS Design System

This file is the **visual source of truth** for the HRMS platform.
Every new screen, component, and style decision must reference this document.

---

## 1. Atmosphere

### Visual Personality

> **Professional. Calm. Operational. Trustworthy.**

This is HR software. It is used daily by HR administrators, managers, and employees to manage sensitive workplace data. The design must feel:

- **Reliable** — Users should trust the system with sensitive employee and payroll data
- **Clear** — HR workflows involve high-stakes decisions; the UI must eliminate ambiguity
- **Efficient** — HR teams process large datasets; density matters more than whitespace
- **Calm** — No distracting animations, aggressive colors, or marketing-style vibrancy

### Avoid

- Excessive glassmorphism (use sparingly and only at the surface level)
- Decorative gradients on data surfaces
- Heavy drop shadows that suggest floating UI when it is not floating
- Marketing-style hero sections or large illustrations in operational screens
- Animations that delay time-sensitive HR operations
- High-contrast flashy color palettes

### Target Aesthetic Reference

Enterprise tools like Linear, Notion, Vercel Dashboard, and GitHub pull requests — clean, neutral, structured, dense-but-readable, with deliberate use of color for status only.

---

## 2. Color System

### Background & Surface

```yaml
color:
  background:       "#F5F5F7"   # App background — very light gray, not pure white
  surface:          "#FFFFFF"   # Cards, panels, containers
  surface-elevated: "#FFFFFF"   # Modals, dropdowns (with shadow, not glassmorphism)
  surface-muted:    "#F9FAFB"   # Table zebra row, section backgrounds
  surface-hover:    "#F3F4F6"   # Hover state for table rows, list items
  border:           "#E5E7EB"   # Dividers, card borders
  border-strong:    "#D1D5DB"   # Input borders, table column separators
```

### Text

```yaml
color:
  text-primary:     "#111827"   # Main content, headings
  text-secondary:   "#6B7280"   # Subtitles, labels, descriptions
  text-tertiary:    "#9CA3AF"   # Placeholders, disabled text
  text-inverse:     "#FFFFFF"   # Text on dark/primary backgrounds
```

### Brand / Primary

```yaml
color:
  primary:          "#2563EB"   # Primary actions (blue — trustworthy, enterprise-standard)
  primary-hover:    "#1D4ED8"   # Hover state for primary
  primary-muted:    "#EFF6FF"   # Light primary tint for selected rows, highlights
  primary-border:   "#BFDBFE"   # Border on focused inputs, selected items
```

### Semantic / Status

```yaml
color:
  success:          "#16A34A"
  success-muted:    "#F0FDF4"
  success-border:   "#BBF7D0"

  warning:          "#D97706"
  warning-muted:    "#FFFBEB"
  warning-border:   "#FDE68A"

  danger:           "#DC2626"
  danger-muted:     "#FEF2F2"
  danger-border:    "#FECACA"

  info:             "#0284C7"
  info-muted:       "#F0F9FF"
  info-border:      "#BAE6FD"
```

### Workflow Status Colors

```yaml
status:
  pending:          { text: "#92400E", bg: "#FEF3C7", dot: "#F59E0B" }   # Amber
  approved:         { text: "#065F46", bg: "#ECFDF5", dot: "#10B981" }   # Green
  rejected:         { text: "#991B1B", bg: "#FEF2F2", dot: "#EF4444" }   # Red
  draft:            { text: "#374151", bg: "#F3F4F6", dot: "#9CA3AF" }   # Gray
  active:           { text: "#1E40AF", bg: "#EFF6FF", dot: "#3B82F6" }   # Blue
  inactive:         { text: "#6B7280", bg: "#F9FAFB", dot: "#D1D5DB" }   # Light gray
  overdue:          { text: "#92400E", bg: "#FFF7ED", dot: "#F97316" }   # Orange
  completed:        { text: "#065F46", bg: "#ECFDF5", dot: "#10B981" }   # Green
  in_progress:      { text: "#1E40AF", bg: "#EFF6FF", dot: "#3B82F6" }   # Blue
  cancelled:        { text: "#6B7280", bg: "#F3F4F6", dot: "#9CA3AF" }   # Gray
```

### Payroll-Specific

```yaml
color:
  earning:          "#16A34A"   # Positive amounts
  deduction:        "#DC2626"   # Negative amounts
  net-pay:          "#111827"   # Final computed value — primary text
```

---

## 3. Typography

### Font Family

```yaml
font:
  sans: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  mono: "ui-monospace, 'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace"
```

Inter is loaded via Google Fonts. Monospace is used for employee IDs, amounts, and PAN/account numbers.

### Type Scale

```yaml
typography:
  display:
    size: "30px"
    weight: "700"
    line-height: "36px"
    usage: "Page-level headings (e.g. Dashboard, Employee Directory)"

  heading:
    size: "20px"
    weight: "600"
    line-height: "28px"
    usage: "Card titles, section headings, modal titles"

  subheading:
    size: "14px"
    weight: "600"
    line-height: "20px"
    letter-spacing: "0.05em"
    transform: "uppercase"
    color: "text-secondary"
    usage: "Category labels above form sections, table column group headers"

  body:
    size: "14px"
    weight: "400"
    line-height: "20px"
    usage: "Primary readable content, form help text, descriptions"

  body-medium:
    size: "14px"
    weight: "500"
    line-height: "20px"
    usage: "Table cell content, primary data values"

  small:
    size: "12px"
    weight: "400"
    line-height: "16px"
    usage: "Meta information, timestamps, captions"

  small-medium:
    size: "12px"
    weight: "500"
    line-height: "16px"
    usage: "Badges, status labels, compact table values"

  kpi:
    size: "28px"
    weight: "700"
    line-height: "36px"
    font: "mono"
    usage: "KPI numbers on dashboard cards"

  table-cell:
    size: "13px"
    weight: "400"
    line-height: "18px"
    usage: "Dense table rows (compact density)"

  numeric:
    font: "mono"
    usage: "All currency, numbers, IDs, PAN, account numbers"
```

---

## 4. Spacing

```yaml
spacing:
  0:    "0px"
  1:    "4px"
  2:    "8px"
  3:    "12px"
  4:    "16px"
  5:    "20px"
  6:    "24px"
  8:    "32px"
  10:   "40px"
  12:   "48px"
  16:   "64px"
```

### Layout Spacing Conventions

```yaml
layout-spacing:
  page-padding:         "32px"   # Outer page padding (horizontal)
  page-padding-mobile:  "16px"
  section-gap:          "24px"   # Gap between sections on a page
  card-padding:         "24px"   # Internal card padding
  card-padding-compact: "16px"   # Internal card padding for compact cards
  form-row-gap:         "16px"   # Vertical gap between form fields
  table-cell-px:        "16px"   # Horizontal table cell padding
  table-cell-py-default:"12px"   # Vertical table cell padding (default density)
  table-cell-py-compact: "8px"   # Vertical table cell padding (compact density)
  table-cell-py-comfortable:"16px" # Vertical table cell padding (comfortable density)
```

---

## 5. Border Radius

```yaml
radius:
  none:   "0px"
  sm:     "4px"    # Badges, tags, small chips
  base:   "6px"    # Inputs, buttons
  md:     "8px"    # Cards, panels
  lg:     "12px"   # Modal dialogs
  xl:     "16px"   # Drawers, sidesheets
  full:   "9999px" # Pill buttons, avatar circles, dot indicators
```

---

## 6. Shadows

```yaml
shadow:
  none:   "none"
  sm:     "0 1px 2px 0 rgb(0 0 0 / 0.05)"                                    # Subtle surface lift
  base:   "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"  # Cards
  md:     "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" # Dropdowns, popovers
  lg:     "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)" # Modals
```

---

## 7. Motion

```yaml
motion:
  fast:     "100ms ease-out"   # Hover states, simple color transitions
  base:     "200ms ease-out"   # Button presses, badge changes, focus rings
  moderate: "300ms ease-out"   # Modal enter, dropdown open
  slow:     "400ms ease-in-out" # Page-level transitions (rare)
```

### Rules

- Use `fast` for all hover/focus color transitions.
- Use `base` for status changes, button feedback.
- Use `moderate` for entering modals, drawers, and command palettes.
- **Never animate table row content** — it creates visual noise in data-heavy workflows.
- Spinner/loading states use CSS-only animations, not JS.

---

## 8. Layout

```yaml
layout:
  sidebar-width:      "240px"
  sidebar-collapsed:  "64px"
  header-height:      "56px"
  max-content-width:  "1400px"
  breakpoints:
    sm:   "640px"
    md:   "768px"
    lg:   "1024px"
    xl:   "1280px"
    2xl:  "1536px"
```

---

## 9. Density

HRMS screens must support three density modes. The **default density** is used on desktop. Compact is used when HR needs to see more rows. Comfortable is used for profile and form pages.

```yaml
density:
  compact:
    table-cell-py: "8px"
    row-height:    "36px"
    font-size:     "12px"

  default:
    table-cell-py: "12px"
    row-height:    "44px"
    font-size:     "13px"

  comfortable:
    table-cell-py: "16px"
    row-height:    "52px"
    font-size:     "14px"
```

Density is a user preference stored in local storage. Tables expose a density toggle in their toolbar.

---

## 10. Component Design Principles

### Button

```yaml
button:
  variants:
    primary:    "bg-primary text-white hover:bg-primary-hover"
    secondary:  "bg-surface border border-border text-text-primary hover:bg-surface-hover"
    ghost:      "text-text-primary hover:bg-surface-hover"
    danger:     "bg-danger text-white hover:bg-red-700"
    danger-outline: "border border-danger text-danger hover:bg-danger-muted"
  sizes:
    sm:   "h-7 px-3 text-xs"
    base: "h-9 px-4 text-sm"
    lg:   "h-10 px-5 text-sm"
  rules:
    - Use primary for the single most important action per page (e.g. "Run Payroll", "Import Employees")
    - Use secondary for secondary actions (e.g. "Export", "Filter")
    - Use ghost for tertiary/inline actions
    - Use danger only for destructive actions (suspend, delete, terminate)
    - Never use more than one primary button per view
    - Loading state: replace label with spinner + "Processing..." text
```

### Input

```yaml
input:
  height: "36px"
  padding: "8px 12px"
  border: "1px solid border-strong"
  border-radius: "radius-base"
  focus: "ring-2 ring-primary-border border-primary"
  placeholder-color: "text-tertiary"
  rules:
    - Labels are always above the input, never floating
    - Required fields are marked with an asterisk (*)
    - Validation errors appear below the input in danger color
    - Use monospace font for IDs, amounts, PAN, account numbers
```

### Badge / Status Chip

```yaml
badge:
  structure: "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full"
  font: "small-medium"
  dot: "w-1.5 h-1.5 rounded-full"
  rule: "Always use semantic status colors. Never use arbitrary badge colors."
```

### Table

```yaml
table:
  header:
    background: "surface-muted"
    font: "small-medium"
    color: "text-secondary"
    text-transform: "uppercase"
    letter-spacing: "0.05em"
    sticky: true
  row:
    hover: "surface-hover"
    selected: "primary-muted"
    border: "border-bottom 1px border"
  bulk-selection:
    - Checkbox in leftmost column
    - Bulk action toolbar appears above table when rows are selected
    - Toolbar shows count + available actions
  empty-state:
    - Icon representing the entity type
    - "No [entities] found" heading
    - Contextual helper text
    - Primary action if applicable
  pagination:
    position: "bottom of table"
    options: "[10, 25, 50, 100] per page"
    format: "Showing X–Y of Z results"
```

### Form Layout

```yaml
form:
  layout: "Vertical (label above input)"
  section-grouping: "Visually group related fields under a subheading"
  column-grid: "2-column on desktop, 1-column on mobile"
  validation: "Real-time validation on blur; show all errors on submit attempt"
  required-indicator: "*"
  submit-placement: "Bottom-right of form or modal"
```

### Modal / Dialog

```yaml
modal:
  max-width:
    sm: "480px"
    md: "640px"
    lg: "800px"
    xl: "1024px"
  padding: "24px"
  border-radius: "radius-lg"
  shadow: "shadow-lg"
  backdrop: "rgba(0,0,0,0.4) blur(2px)"
  structure:
    - Header (title + close button)
    - Body (scrollable if tall)
    - Footer (Cancel + Primary action)
  rule: "Modals must have a clear single purpose. Use drawers for complex multi-step flows."
```

### Drawer / Side Panel

```yaml
drawer:
  width:
    sm: "480px"
    md: "640px"
    lg: "800px"
  position: "right"
  usage: "Employee detail panel, approval detail, long forms"
  backdrop: "rgba(0,0,0,0.3)"
  animation: "slide-in from right, 300ms ease-out"
```

### Toast / Notification

```yaml
toast:
  position: "top-right"
  max-width: "360px"
  variants:
    success: "border-left: 4px solid success; icon: CheckCircle"
    error:   "border-left: 4px solid danger; icon: XCircle"
    warning: "border-left: 4px solid warning; icon: AlertTriangle"
    info:    "border-left: 4px solid info; icon: Info"
  duration:
    success: "3000ms"
    error:   "persist until dismissed"
    warning: "5000ms"
    info:    "3000ms"
```

### Timeline (Employee Lifecycle)

```yaml
timeline:
  layout: "Vertical list with connector line"
  item:
    - Dot (colored by event type)
    - Event name (body-medium)
    - Date + Actor (small, text-secondary)
    - Details (body, expandable)
  connector: "1px solid border"
  empty: "Employee timeline will appear here as lifecycle events occur."
```

### Approval Card

```yaml
approval-card:
  structure:
    - Employee name + avatar
    - Request type badge
    - Date submitted
    - Details summary (2–3 lines max)
    - Action buttons: Approve, Reject, View Details
  layout: "Card list, not table — allows richer context per request"
  priority: "Overdue requests shown with warning indicator"
```

### KPI Card

```yaml
kpi-card:
  structure:
    - Label (small-medium, text-secondary)
    - Value (kpi typography, numeric font)
    - Trend indicator (optional: up/down with percentage)
    - Period label (small, text-tertiary)
  background: surface
  border: "1px solid border"
  shadow: "shadow-sm"
```

### Empty State

```yaml
empty-state:
  icon: "Lucide icon representing the entity — 48px, text-tertiary color"
  heading: "No [entities] found"   # e.g. "No employees found"
  description: "Contextual explanation"
  action: "Primary action button if relevant"
  usage: "Every list page, every table must handle empty state"
```

### Loading State

```yaml
loading:
  table: "Skeleton rows (3–5 rows) using shimmer animation"
  card: "Skeleton card using shimmer animation"
  page: "Full page spinner with 'Loading...' text — avoid when possible"
  inline: "Spinner (Loader2 from Lucide) replacing button label during mutation"
  rule: "Never show an empty table without a clear loading indicator or empty state"
```

---

## 11. Page Patterns

### Dashboard Page

```
[Top: KPI Cards Row — 4 cards]
[Alerts: Operational banner if urgent items exist]
[Middle: HR Task Center widget + Recent activity]
[Bottom: Analytics charts]
```

Rules:
- KPI cards show: Today's attendance %, Pending approvals, New joiners this month, Headcount
- Charts use Recharts with primary color palette
- No decorative hero images

### List Page (Standard Pattern)

```
[Page Header: Title + Primary Action Button]
[Filter Bar: Key filters as quick-select chips]
[Search + Density Toggle + Column Visibility + Export]
[Bulk Action Toolbar: appears when rows selected]
[TanStack Table: sortable, filterable, paginated]
[Pagination: page size + page navigation]
```

### Detail / Profile Page

```
[Breadcrumb + Back navigation]
[Profile Header: Avatar + Name + Employee ID + Status Badge + Action Buttons]
[Summary Row: Department, Designation, Manager, Joining Date]
[Tab Bar: Overview | Work Info | Documents | Timeline | Attendance | Leave | Payroll]
[Tab Content]
```

### Workflow / Request Page

```
[Breadcrumb]
[Status Banner: current status with color]
[2-column layout:]
  [Left: Request Details Card]
  [Right: Approver Timeline + Actions]
[Comments Thread]
[Audit Log]
```

### Wizard / Multi-Step Form

```
[Progress Indicator: Step 1 of 4 — step labels visible]
[Step Content]
[Validation Summary: inline — not blocking progress unnecessarily]
[Navigation: Back | Next | (Submit on last step)]
```

---

## 12. Icon System

Use **Lucide React** exclusively. Do not mix icon libraries.

```yaml
icon-sizes:
  xs: "12px"
  sm: "14px"
  base: "16px"
  md: "18px"
  lg: "20px"
  xl: "24px"
  2xl: "32px"
  display: "48px"

icon-color:
  default: "text-secondary"
  active: "primary"
  danger: "danger"
  success: "success"
  muted: "text-tertiary"
```

---

## 13. Grid & Responsive Behavior

```yaml
responsive:
  desktop: "Full sidebar + main content; tables show all columns"
  tablet:  "Collapsed sidebar; tables hide non-essential columns"
  mobile:  "Hidden sidebar (drawer); cards replace tables where possible"
```

Mobile self-service (My Workspace) must be fully usable on a 375px viewport.
HR administration screens are desktop-primary; mobile is read-only.

---

## 14. Data Display Rules

| Data Type | Formatting |
|---|---|
| Currency (INR) | `₹1,23,456.00` (Indian notation, monospace) |
| Percentage | `87.5%` |
| Date | `28 Aug 2026` |
| Date + Time | `28 Aug 2026, 09:30 AM` |
| Time | `09:30 AM` |
| Duration | `8h 30m` |
| Employee ID | `EMP-001` (monospace) |
| PAN | `ABCDE1234F` (monospace, masked except last 4 for non-payroll roles) |
| Mobile | `+91 98765 43210` |

---

## 15. Accessibility

- Minimum contrast ratio: **4.5:1** for body text, **3:1** for large text
- All interactive elements must have visible focus indicators
- Form inputs must have explicit `<label>` associations
- Status indicators must never rely on color alone — always include icon or text
- ARIA roles must be applied to modals, drawers, and dropdown menus
- Tables must use `<thead>`, `<th scope="col">`, and `<caption>` where applicable

---

## 16. Design Rule Summary

```
80% Clarity
15% Visual Personality
5% Delight
```

The UI serves HR operations. Every visual decision must be justified by usability, not aesthetics.

When in doubt:
- Use less color
- Use less shadow
- Use less animation
- Use more whitespace between logical groups
- Use clearer labels
