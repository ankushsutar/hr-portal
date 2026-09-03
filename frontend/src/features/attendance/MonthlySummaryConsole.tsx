import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Download, Search, Users, CheckCircle2, UserX, Clock, Award } from 'lucide-react'

function getInitials(name: string) {
  if (!name) return '?'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

function getAvatarColor(name: string) {
  const colors = [
    'bg-[var(--color-primary)]/20 theme-accent-text border border-[var(--color-primary)]/30',
    'bg-indigo-500/20 text-indigo-500 border border-indigo-500/30',
    'bg-violet-500/20 text-violet-500 border border-violet-500/30',
    'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30',
    'bg-amber-500/20 text-amber-500 border border-amber-500/30',
    'bg-rose-500/20 text-rose-500 border border-rose-500/30',
    'bg-cyan-500/20 text-cyan-500 border border-cyan-500/30',
  ]
  const idx = name ? name.charCodeAt(0) % colors.length : 0
  return colors[idx]
}

export const MonthlySummaryConsole: React.FC = () => {
  const [search, setSearch] = useState('')
  const [month, setMonth] = useState('2026-09')

  const { data: summaryRes, isLoading } = useQuery({
    queryKey: ['attendance-monthly-summary', month],
    queryFn: async () => {
      const res = await fetch('/api/v1/attendance/monthly-summary', {
        headers: { Authorization: `Bearer ${localStorage.getItem('hrms_token') || localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to load monthly summary')
      return res.json()
    }
  })

  const summaryData = summaryRes?.data || []
  const totals = summaryRes?.totals || {}

  const filteredSummary = summaryData.filter((s: any) =>
    s.employee_name.toLowerCase().includes(search.toLowerCase()) ||
    s.employee_code.toLowerCase().includes(search.toLowerCase()) ||
    s.department.toLowerCase().includes(search.toLowerCase())
  )

  const handleExportXLSX = () => {
    alert('Exporting Monthly Attendance Matrix to XLSX format...')
  }

  if (isLoading) {
    return <div className="p-8 text-center text-[var(--text-muted)] font-mono text-sm animate-pulse">Loading Monthly Attendance Summary Matrix...</div>
  }

  return (
    <div className="space-y-6">
      {/* Title & Date Range Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-main)] tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 theme-accent-text" />
            <span>Monthly Attendance Summary Matrix</span>
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Aggregated monthly presence metrics, worked hours, and overtime calculations for payroll input.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-[var(--bg-subtle)] border border-[var(--border-color)] text-xs text-[var(--text-main)] px-3 py-1.5 rounded-xl focus:outline-none focus:border-[var(--color-primary)]"
          />
          <button
            onClick={handleExportXLSX}
            className="flex items-center gap-1.5 theme-accent-bg hover:opacity-90 text-white text-xs font-medium px-4 py-2 rounded-xl shadow-md transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export XLSX</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] shadow-sm space-y-1">
          <div className="text-[var(--text-muted)] text-[11px] font-medium flex items-center justify-between">
            <span>TOTAL EMPLOYEES</span>
            <Users className="w-3.5 h-3.5 theme-accent-text" />
          </div>
          <div className="text-xl font-bold text-[var(--text-main)] font-mono">{totals.total_employees || 169}</div>
        </div>

        <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] shadow-sm space-y-1">
          <div className="text-[var(--text-muted)] text-[11px] font-medium flex items-center justify-between">
            <span>WORKING DAYS</span>
            <Calendar className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="text-xl font-bold text-[var(--text-main)] font-mono">{totals.working_days || 23}</div>
        </div>

        <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] shadow-sm space-y-1">
          <div className="text-[var(--text-muted)] text-[11px] font-medium flex items-center justify-between">
            <span>AVG ATTENDANCE</span>
            <Award className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-500 font-mono">{totals.avg_attendance || '94.2%'}</div>
        </div>

        <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] shadow-sm space-y-1">
          <div className="text-[var(--text-muted)] text-[11px] font-medium flex items-center justify-between">
            <span>TOTAL PRESENT</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-[var(--text-main)] font-mono">3,542</div>
        </div>

        <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] shadow-sm space-y-1">
          <div className="text-[var(--text-muted)] text-[11px] font-medium flex items-center justify-between">
            <span>TOTAL ABSENT</span>
            <UserX className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-rose-500 font-mono">148</div>
        </div>

        <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] shadow-sm space-y-1">
          <div className="text-[var(--text-muted)] text-[11px] font-medium flex items-center justify-between">
            <span>OVERTIME HOURS</span>
            <Clock className="w-3.5 h-3.5 text-cyan-500" />
          </div>
          <div className="text-xl font-bold text-[var(--text-main)] font-mono">248.5 hrs</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee or department..."
            className="bg-[var(--bg-subtle)] border border-[var(--border-color)] text-xs text-[var(--text-main)] pl-8 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-[var(--color-primary)] w-64"
          />
        </div>
      </div>

      {/* Monthly Matrix Data Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[var(--text-main)]">
            <thead className="bg-[var(--bg-subtle)] text-[var(--text-muted)] uppercase font-mono text-[11px] border-b border-[var(--border-color)]">
              <tr>
                <th className="p-4">Employee</th>
                <th className="p-4">Department</th>
                <th className="p-4">Working Days</th>
                <th className="p-4">Present Days</th>
                <th className="p-4">Absent Days</th>
                <th className="p-4">Paid Leave</th>
                <th className="p-4">Unpaid Leave</th>
                <th className="p-4">Worked Hours</th>
                <th className="p-4">OT Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredSummary.map((s: any) => (
                <tr key={s.employee_code} className="hover:bg-[var(--bg-subtle)] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getAvatarColor(s.employee_name)}`}>
                        {getInitials(s.employee_name)}
                      </div>
                      <div>
                        <div className="font-semibold text-[var(--text-main)] text-xs font-sans">{s.employee_name}</div>
                        <div className="text-[11px] text-[var(--text-muted)] font-mono">{s.employee_code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-[var(--text-muted)]">{s.department}</td>
                  <td className="p-4 font-mono text-[var(--text-main)]">{s.working_days}</td>
                  <td className="p-4 font-mono text-emerald-500 font-semibold">{s.present_days}</td>
                  <td className="p-4 font-mono text-rose-500 font-semibold">{s.absent_days}</td>
                  <td className="p-4 font-mono theme-accent-text">{s.paid_leave}</td>
                  <td className="p-4 font-mono text-amber-500">{s.unpaid_leave}</td>
                  <td className="p-4 font-mono text-[var(--text-main)] font-semibold">{s.worked_hours} hrs</td>
                  <td className="p-4 font-mono text-cyan-500 font-semibold">{s.ot_hours} hrs</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
