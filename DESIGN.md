# Enterprise HRMS — Design System & UI Specifications

This document defines the visual architecture, design principles, component specifications, color system, typography rules, and UI patterns for the **Enterprise HRMS Platform**.

---

## 1. Design Philosophy

Our design system is inspired by modern high-density developer tools (such as **skills.sh**), adapted specifically for enterprise human resource management:

1. **High Information Density**: Maximizes visible data per screen with compact spacing, low padding overhead, and clean metadata presentation.
2. **Dark-Mode First Ergonomics**: Built on a deep obsidian (`#0B0F19`) background to reduce eye strain during prolonged operational usage.
3. **Tabular Monospace Metadata**: All IDs (`EMP-1024`), financial figures (`₹85,000`), dates (`2026-08-28`), counts, and status pills strictly utilize tabular monospace fonts (`JetBrains Mono`, `Fira Code`).
4. **Hairline Precision Borders**: Clean `1px border-slate-800` borders replace heavy shadows or excessive glassmorphic gradients.
5. **Actionable Status Badging**: High-contrast, semantic status pills provide instant visual classification across all tables and consoles.

---

## 2. Color System

### Base Surfaces
- **App Background**: `#0B0F19` (`bg-[#0B0F19]`) — Primary dark background.
- **Card / Console Surface**: `#111827` (`bg-[#111827]` / `bg-slate-900`) — Primary container surface.
- **Header / Navigation Shell**: `#111827`/80 with backdrop blur (`backdrop-blur`).
- **Interactive Element Surface**: `#161B26` / `#1F2937` (`bg-slate-800/60`).
- **Borders & Dividers**: `#1F2937` (`border-slate-800`) / `#374151` (`border-slate-700`).

### Typography Palette
- **Primary Text**: `#F9FAFB` (`text-slate-100` / `text-white`) — Headings and primary data.
- **Secondary Text**: `#9CA3AF` (`text-slate-400`) — Subtitles and field labels.
- **Muted Text**: `#6B7280` (`text-slate-500`) — Captions and timestamps.
- **Monospace Metadata**: `#93C5FD` (`text-blue-300`) / `#A7F3D0` (`text-emerald-300`).

### Semantic Status Colors
- **Success / Approved / Active**: 
  - Text: `text-emerald-400`
  - Surface: `bg-emerald-500/10`
  - Border: `border-emerald-500/20`
- **Warning / Pending / Probation**: 
  - Text: `text-amber-400`
  - Surface: `bg-amber-500/10`
  - Border: `border-amber-500/20`
- **Danger / Rejected / Anomaly / Urgent**: 
  - Text: `text-rose-400`
  - Surface: `bg-rose-500/10`
  - Border: `border-rose-500/20`
- **Info / WFH / On Duty**: 
  - Text: `text-sky-400`
  - Surface: `bg-sky-500/10`
  - Border: `border-sky-500/20`
- **Neutral / Draft / Archived**: 
  - Text: `text-slate-400`
  - Surface: `bg-slate-800`
  - Border: `border-slate-700`

---

## 3. Typography & Fonts

- **UI & Reading**: `'Inter', system-ui, -apple-system, sans-serif`
- **Code, Metadata, Monetary Amounts, IDs, Dates**: `'JetBrains Mono', 'Fira Code', monospace`

### Scale & Hierarchy
- **Page Titles**: `28px` (`text-[28px]`), Bold (`font-bold`), Tracking Tight (`tracking-tight`), `text-slate-100`.
- **Subtitle / Eyebrow**: `11px-12px` (`text-xs`), Monospace (`font-mono`), Uppercase (`uppercase`), `text-slate-400`.
- **Card Titles**: `14px-16px` (`text-sm` to `text-base`), SemiBold (`font-semibold`), `text-slate-100`.
- **Body & Table Text**: `12px-13px` (`text-xs`), Medium (`font-medium`), `text-slate-200`.
- **Badges & Pills**: `10px-11px` (`text-[10px]` to `text-[11px]`), Monospace (`font-mono`), Bold (`font-bold`).

---

## 4. Component Standards

### Cards & Consoles
```tsx
<div className="bg-[#111827] border border-slate-800 rounded-lg p-5">
  {/* Content */}
</div>
```

### Primary & Secondary Buttons
```tsx
// Primary Button
<button className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-mono font-semibold transition-colors">
  Execute Action
</button>

// Secondary / Outline Button
<button className="bg-[#111827] hover:bg-slate-800 text-slate-200 border border-slate-800 px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors">
  Cancel
</button>
```

### Data Tables
- **Header**: `bg-slate-900/60 font-mono text-xs uppercase text-slate-400 border-b border-slate-800 py-2.5 px-4`
- **Cell**: `border-b border-slate-800/60 text-slate-200 text-xs py-3 px-4 font-mono-for-metadata`
- **Row Hover**: `hover:bg-slate-800/40 transition-colors`

---

## 5. Layout Architecture

- **Sidebar**: Fixed width `w-64`, `#111827` surface, `border-r border-slate-800`.
- **Top Header**: Height `h-16`, `#111827`/80 surface, sticky top, breadcrumb console indicator, command bar (`⌘K`), notification bell popover drawer.
- **Main Area**: `flex-1 bg-[#0B0F19] overflow-auto p-6`. Max content container width `max-w-7xl`.
