import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, Clock, AlertTriangle, CheckCircle2, UserX, BarChart3, TrendingUp } from 'lucide-react'

export const AttendanceDashboardView: React.FC = () => {
  const { data: metricsRes, isLoading } = useQuery({
    queryKey: ['attendance-dashboard-metrics'],
    queryFn: async () => {
      const res = await fetch('/api/v1/attendance/dashboard-metrics', {
        headers: { Authorization: `Bearer ${localStorage.getItem('hrms_token') || localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to load dashboard metrics')
      return res.json()
    }
  })

  const metrics = metricsRes?.data || {}

  if (isLoading) {
    return <div className="p-8 text-center text-[var(--text-muted)] font-mono text-sm animate-pulse">Loading Attendance Analytics...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-main)] tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 theme-accent-text" />
            <span>Attendance Dashboard & Analytics</span>
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Real-time workforce presence monitoring, shift exception tracking, and overtime queue metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-semibold">
            Live Stream Active
          </span>
        </div>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-medium">
            <span>PRESENT TODAY</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-main)] font-mono">{metrics.present_today} <span className="text-xs text-[var(--text-muted)] font-normal">/ {metrics.total_employees}</span></div>
          <div className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>{metrics.present_percentage}% Workforce Present</span>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-medium">
            <span>ON TIME</span>
            <CheckCircle2 className="w-4 h-4 theme-accent-text" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-main)] font-mono">{metrics.on_time}</div>
          <div className="text-[11px] text-[var(--text-muted)]">Punctual arrival rate</div>
        </div>

        <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-medium">
            <span>LATE & EARLY OUT</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-500 font-mono">{metrics.late_arrivals + metrics.early_departures}</div>
          <div className="text-[11px] text-amber-500">{metrics.late_arrivals} Late, {metrics.early_departures} Early</div>
        </div>

        <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-medium">
            <span>PENDING VALIDATION</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-500 font-mono">{metrics.pending_validation}</div>
          <div className="text-[11px] text-purple-500">Awaiting Manager Sign-off</div>
        </div>

        <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-medium">
            <span>OT PENDING</span>
            <BarChart3 className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-bold text-cyan-500 font-mono">{metrics.ot_pending}</div>
          <div className="text-[11px] text-cyan-500">Overtime hours queue</div>
        </div>
      </div>

      {/* Analytics Grid: Hourly Distribution & Department Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Clock-in Histogram */}
        <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-[var(--text-main)] flex items-center gap-2">
            <Clock className="w-4 h-4 theme-accent-text" />
            <span>Clock-In Arrival Distribution (Today)</span>
          </h2>
          <div className="space-y-3 pt-2">
            {metrics.clock_in_distribution?.map((item: any) => (
              <div key={item.hour} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[var(--text-main)]">{item.hour} Window</span>
                  <span className="theme-accent-text font-semibold">{item.count} check-ins</span>
                </div>
                <div className="w-full h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden border border-[var(--border-color)]">
                  <div
                    className="h-full theme-accent-bg rounded-full transition-all duration-500"
                    style={{ width: `${(item.count / 80) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Attendance Rates */}
        <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-[var(--text-main)] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            <span>Departmental Presence Ratio</span>
          </h2>
          <div className="space-y-3 pt-2">
            {metrics.dept_attendance_rate?.map((dept: any) => (
              <div key={dept.department} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-main)] font-medium">{dept.department}</span>
                  <span className="text-emerald-500 font-mono font-semibold">{dept.rate}%</span>
                </div>
                <div className="w-full h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden border border-[var(--border-color)]">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${dept.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Absentees Panel */}
      <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-[var(--text-main)] flex items-center gap-2">
          <UserX className="w-4 h-4 text-rose-500" />
          <span>Top Absentee Watchlist (Current Month)</span>
        </h2>
        <div className="divide-y divide-[var(--border-color)]">
          {metrics.top_absentees?.map((emp: any) => (
            <div key={emp.employee_name} className="py-3 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="font-semibold text-[var(--text-main)]">{emp.employee_name}</div>
                <div className="text-[var(--text-muted)] font-mono">{emp.department}</div>
              </div>
              <div className="px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 font-mono font-semibold">
                {emp.absent_days} Unexcused Absences
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
