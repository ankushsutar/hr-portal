import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Activity, Clock, SlidersHorizontal, Search, Trash2 } from 'lucide-react'

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

export const AttendanceActivityView: React.FC = () => {
  const [search, setSearch] = useState('')

  const { data: actRes, isLoading } = useQuery({
    queryKey: ['attendance-activities'],
    queryFn: async () => {
      const res = await fetch('/api/v1/attendance/activities', {
        headers: { Authorization: `Bearer ${localStorage.getItem('hrms_token') || localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to load activities')
      return res.json()
    }
  })

  const activities = actRes?.data || []

  const filteredActivities = activities.filter((a: any) =>
    a.employee_name.toLowerCase().includes(search.toLowerCase()) ||
    a.employee_code.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return <div className="p-8 text-center text-[var(--text-muted)] font-mono text-sm animate-pulse">Loading Attendance Activity Event Stream...</div>
  }

  return (
    <div className="space-y-6">
      {/* Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-main)] tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-500" />
            <span>Check-in / Check-out Raw Activity Log</span>
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Microsecond raw event audit trail for biometric and web portal punches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee..."
              className="bg-[var(--bg-subtle)] border border-[var(--border-color)] text-xs text-[var(--text-main)] pl-8 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-[var(--color-primary)] w-52"
            />
          </div>

          <button className="p-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]" title="Customize Columns">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Raw Event Stream Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[var(--text-main)]">
            <thead className="bg-[var(--bg-subtle)] text-[var(--text-muted)] uppercase font-mono text-[11px] border-b border-[var(--border-color)]">
              <tr>
                <th className="p-4">Employee</th>
                <th className="p-4">Attendance Date</th>
                <th className="p-4">In Date</th>
                <th className="p-4">Check-In Timestamp</th>
                <th className="p-4">Check-Out Timestamp</th>
                <th className="p-4">Out Date</th>
                <th className="p-4">Duration (HH:MM:SS)</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredActivities.map((act: any) => (
                <tr
                  key={act.id}
                  className={`transition-colors ${
                    act.is_active
                      ? 'bg-amber-500/10 hover:bg-amber-500/15 border-l-4 border-amber-500'
                      : 'hover:bg-[var(--bg-subtle)]'
                  }`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getAvatarColor(act.employee_name)}`}>
                        {getInitials(act.employee_name)}
                      </div>
                      <div>
                        <div className="font-semibold text-[var(--text-main)] text-xs font-sans">{act.employee_name}</div>
                        <div className="text-[11px] text-[var(--text-muted)] font-mono">{act.employee_code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-[var(--text-muted)]">{act.attendance_date}</td>
                  <td className="p-4 font-mono text-[var(--text-muted)]">{act.in_date}</td>
                  <td className="p-4 font-mono text-emerald-500 font-semibold">{act.check_in}</td>
                  <td className="p-4 font-mono text-amber-500 font-semibold">
                    {act.is_active ? (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30 text-[10px]">
                        None (Active Session)
                      </span>
                    ) : (
                      act.check_out
                    )}
                  </td>
                  <td className="p-4 font-mono text-[var(--text-muted)]">{act.out_date}</td>
                  <td className="p-4 font-mono theme-accent-text flex items-center gap-1.5">
                    {act.is_active && <Clock className="w-3 h-3 text-amber-500 animate-pulse" />}
                    <span>{act.duration}</span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors" title="Delete Log Entry">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
