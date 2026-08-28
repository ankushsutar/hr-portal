# Enterprise HRMS Design System (Dark-Mode First)

This document serves as the single source of truth for the visual design, typography, components, and layout specs for the Enterprise HRMS platform.

## Design Philosophy
Inspired by high-density developer consoles and modern developer tools (e.g. skills.sh), the design prioritizes high information density, speed, dark-mode ergonomics, crisp contrast, and precision.

- **Developer Console Ergonomics**: Compact spacing, monospace metadata, data-dense tables, and clean status indicators.
- **Dark-Mode First**: Built on deep obsidian `#0B0F19` with dark slate surfaces `#111827` / `#161B26` and subtle `#1F2937` borders.
- **Focused Accents**: Single electric blue (`#3B82F6`) / mint green (`#10B981`) primary accent reserved for critical actions, active states, and key data.
- **Zero Fluff**: Minimal gradients, zero excessive glassmorphism, crisp hairline borders (`1px border-slate-800`).

---

## Color Palette

### Base Surfaces
- **App Background**: `#0B0F19` (`bg-[#0B0F19]`)
- **Card / Surface**: `#111827` or `#161B26` (`bg-slate-900` or `bg-[#161B26]`)
- **Subtle Surface / Hover**: `#1F2937` or `#1E2433` (`bg-slate-800/50`)
- **Borders**: `#1F2937` or `#2D3748` (`border-slate-800` or `border-gray-800`)

### Typography Colors
- **Primary Text**: `#F9FAFB` (`text-slate-50` / `text-white`)
- **Secondary Text**: `#9CA3AF` (`text-slate-400`)
- **Muted Text**: `#6B7280` (`text-slate-500`)
- **Monospace Metadata**: `#A7F3D0` / `#93C5FD` (`text-emerald-300` / `text-blue-300`)

### Accents & Statuses
- **Primary Accent**: `#3B82F6` (Electric Blue) or `#10B981` (Mint Green)
- **Success / Present**: `text-emerald-400` / `bg-emerald-500/10` / `border-emerald-500/20`
- **Warning / Pending**: `text-amber-400` / `bg-amber-500/10` / `border-amber-500/20`
- **Danger / Absent**: `text-rose-400` / `bg-rose-500/10` / `border-rose-500/20`
- **Info / WFH / OD**: `text-sky-400` / `bg-sky-500/10` / `border-sky-500/20`

---

## Typography & Fonts
- **UI & Reading**: `'Inter', sans-serif`
- **IDs, Codes, Logs, Metrics**: `'JetBrains Mono', 'Fira Code', monospace`

---

## Spacing & Components
- **Density**: Compact padding (`px-3 py-1.5` for buttons, `px-4 py-3` for table cells).
- **Cards**: `bg-[#111827] border border-slate-800 rounded-lg p-5`
- **Buttons**:
  - Primary: `bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded px-3 py-1.5`
  - Secondary / Outline: `bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs rounded px-3 py-1.5`
- **Tables**:
  - Header: `bg-slate-900/80 text-slate-400 font-semibold text-xs uppercase tracking-wider border-b border-slate-800`
  - Cell: `border-b border-slate-800/60 text-slate-200 text-sm py-2.5 px-4 font-mono-for-metadata`
  - Row Hover: `hover:bg-slate-800/40 transition-colors`
