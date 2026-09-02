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
    return <div className="p-8 text-center text-slate-400 font-mono text-sm animate-pulse">Loading Attendance Analytics...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <span>Attendance Dashboard & Analytics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time workforce presence monitoring, shift exception tracking, and overtime queue metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
            Live Stream Active
          </span>
        </div>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>PRESENT TODAY</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{metrics.present_today} <span className="text-xs text-slate-400 font-normal">/ {metrics.total_employees}</span></div>
          <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>{metrics.present_percentage}% Workforce Present</span>
          </div>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>ON TIME</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{metrics.on_time}</div>
          <div className="text-[11px] text-slate-400">Punctual arrival rate</div>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>LATE & EARLY OUT</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">{metrics.late_arrivals + metrics.early_departures}</div>
          <div className="text-[11px] text-amber-400/80">{metrics.late_arrivals} Late, {metrics.early_departures} Early</div>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>PENDING VALIDATION</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300 font-mono">{metrics.pending_validation}</div>
          <div className="text-[11px] text-purple-400/80">Awaiting Manager Sign-off</div>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>OT PENDING</span>
            <BarChart3 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300 font-mono">{metrics.ot_pending}</div>
          <div className="text-[11px] text-cyan-400/80">Overtime hours queue</div>
        </div>
      </div>

      {/* Analytics Grid: Hourly Distribution & Department Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Clock-in Histogram */}
        <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>Clock-In Arrival Distribution (Today)</span>
          </h2>
          <div className="space-y-3 pt-2">
            {metrics.clock_in_distribution?.map((item: any) => (
              <div key={item.hour} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">{item.hour} Window</span>
                  <span className="text-blue-400 font-semibold">{item.count} check-ins</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${(item.count / 80) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Attendance Rates */}
        <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Departmental Presence Ratio</span>
          </h2>
          <div className="space-y-3 pt-2">
            {metrics.dept_attendance_rate?.map((dept: any) => (
              <div key={dept.department} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">{dept.department}</span>
                  <span className="text-emerald-400 font-mono font-semibold">{dept.rate}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${dept.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Absentees Panel */}
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <UserX className="w-4 h-4 text-rose-400" />
          <span>Top Absentee Watchlist (Current Month)</span>
        </h2>
        <div className="divide-y divide-slate-800/60">
          {metrics.top_absentees?.map((emp: any) => (
            <div key={emp.employee_name} className="py-3 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="font-semibold text-slate-200">{emp.employee_name}</div>
                <div className="text-slate-500 font-mono">{emp.department}</div>
              </div>
              <div className="px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono font-semibold">
                {emp.absent_days} Unexcused Absences
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
