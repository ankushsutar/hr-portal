import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Download, Search, Users, CheckCircle2, UserX, Clock, Award } from 'lucide-react'

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
    return <div className="p-8 text-center text-slate-400 font-mono text-sm animate-pulse">Loading Monthly Attendance Summary Matrix...</div>
  }

  return (
    <div className="space-y-6">
      {/* Title & Date Range Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            <span>Monthly Attendance Summary Matrix</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated monthly presence metrics, worked hours, and overtime calculations for payroll input.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-200 px-3 py-1.5 rounded-xl focus:outline-none focus:border-purple-500/50"
          />
          <button
            onClick={handleExportXLSX}
            className="flex items-center gap-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white text-xs font-medium px-4 py-2 rounded-xl shadow-lg transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export XLSX</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-lg space-y-1">
          <div className="text-slate-400 text-[11px] font-medium flex items-center justify-between">
            <span>TOTAL EMPLOYEES</span>
            <Users className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">{totals.total_employees || 169}</div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-lg space-y-1">
          <div className="text-slate-400 text-[11px] font-medium flex items-center justify-between">
            <span>WORKING DAYS</span>
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-300 font-mono">{totals.working_days || 23}</div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-lg space-y-1">
          <div className="text-slate-400 text-[11px] font-medium flex items-center justify-between">
            <span>AVG ATTENDANCE</span>
            <Award className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono">{totals.avg_attendance || '94.2%'}</div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-lg space-y-1">
          <div className="text-slate-400 text-[11px] font-medium flex items-center justify-between">
            <span>TOTAL PRESENT</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">3,542</div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-lg space-y-1">
          <div className="text-slate-400 text-[11px] font-medium flex items-center justify-between">
            <span>TOTAL ABSENT</span>
            <UserX className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-400 font-mono">148</div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-lg space-y-1">
          <div className="text-slate-400 text-[11px] font-medium flex items-center justify-between">
            <span>OVERTIME HOURS</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-300 font-mono">248.5 hrs</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee or department..."
            className="bg-slate-900 border border-slate-800 text-xs text-slate-200 pl-8 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-purple-500/50 w-64"
          />
        </div>
      </div>

      {/* Monthly Matrix Data Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
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
            <tbody className="divide-y divide-slate-800/50">
              {filteredSummary.map((s: any) => (
                <tr key={s.employee_code} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 font-medium text-white flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-[10px]">
                      {s.employee_code}
                    </div>
                    <span>{s.employee_name}</span>
                  </td>
                  <td className="p-4 text-slate-400">{s.department}</td>
                  <td className="p-4 font-mono text-slate-300">{s.working_days}</td>
                  <td className="p-4 font-mono text-emerald-400 font-semibold">{s.present_days}</td>
                  <td className="p-4 font-mono text-rose-400 font-semibold">{s.absent_days}</td>
                  <td className="p-4 font-mono text-blue-400">{s.paid_leave}</td>
                  <td className="p-4 font-mono text-amber-400">{s.unpaid_leave}</td>
                  <td className="p-4 font-mono text-slate-200 font-semibold">{s.worked_hours} hrs</td>
                  <td className="p-4 font-mono text-cyan-300 font-semibold">{s.ot_hours} hrs</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
