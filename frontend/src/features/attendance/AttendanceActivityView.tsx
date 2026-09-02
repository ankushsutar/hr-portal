import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Activity, Clock, SlidersHorizontal, Search, Trash2 } from 'lucide-react'

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
    return <div className="p-8 text-center text-slate-400 font-mono text-sm animate-pulse">Loading Attendance Activity Event Stream...</div>
  }

  return (
    <div className="space-y-6">
      {/* Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            <span>Check-in / Check-out Raw Activity Log</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Microsecond raw event audit trail for biometric and web portal punches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee..."
              className="bg-slate-900 border border-slate-800 text-xs text-slate-200 pl-8 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-amber-500/50 w-52"
            />
          </div>

          <button className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white" title="Customize Columns">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Raw Event Stream Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
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
            <tbody className="divide-y divide-slate-800/50">
              {filteredActivities.map((act: any) => (
                <tr
                  key={act.id}
                  className={`transition-colors ${
                    act.is_active
                      ? 'bg-amber-500/10 hover:bg-amber-500/15 border-l-4 border-amber-400'
                      : 'hover:bg-slate-800/30'
                  }`}
                >
                  <td className="p-4 font-medium text-white flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-800 text-amber-300 flex items-center justify-center font-bold text-[10px]">
                      {act.employee_code}
                    </div>
                    <span>{act.employee_name}</span>
                  </td>
                  <td className="p-4 font-mono text-slate-400">{act.attendance_date}</td>
                  <td className="p-4 font-mono text-slate-400">{act.in_date}</td>
                  <td className="p-4 font-mono text-emerald-400 font-semibold">{act.check_in}</td>
                  <td className="p-4 font-mono text-amber-400 font-semibold">
                    {act.is_active ? (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px]">
                        None (Active Session)
                      </span>
                    ) : (
                      act.check_out
                    )}
                  </td>
                  <td className="p-4 font-mono text-slate-400">{act.out_date}</td>
                  <td className="p-4 font-mono text-blue-400 flex items-center gap-1.5">
                    {act.is_active && <Clock className="w-3 h-3 text-amber-400 animate-pulse" />}
                    <span>{act.duration}</span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors" title="Delete Log Entry">
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
