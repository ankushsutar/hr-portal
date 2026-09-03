import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { Card } from '../../components/ui/Card'
import { PaginationBar } from '../../components/ui/PaginationBar'
import { useTableState } from '../../hooks/useTableState'
import { Clock, CheckCircle2, XCircle, AlertCircle, Search } from 'lucide-react'
import { AttendanceValidation } from './AttendanceValidation'
import { ExceptionQueue } from './ExceptionQueue'
import { AttendanceRulesConfig } from './AttendanceRulesConfig'
import { AttendanceDashboardView } from './AttendanceDashboardView'
import { AttendanceRequestsView } from './AttendanceRequestsView'
import { AttendanceActivityView } from './AttendanceActivityView'
import { MonthlySummaryConsole } from './MonthlySummaryConsole'

export const AttendanceDashboard = () => {
  const { hasRole } = useAuth() as any
  const [viewMode, setViewMode] = useState<'dashboard' | 'daily' | 'requests' | 'activity' | 'monthly' | 'validation' | 'exceptions' | 'rules'>('dashboard')
  const [date] = useState(new Date().toISOString().split('T')[0])

  const {
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
    filters,
    setFilter,
    queryParams,
  } = useTableState({ initialLimit: 10 })

  queryParams.set('date', date)

  const { data, isLoading } = useQuery({
    queryKey: ['attendance-daily', date, queryParams.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/v1/attendance/daily?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to fetch attendance')
      return res.json()
    }
  })

  if (isLoading) return <div className="p-8 text-[var(--text-muted)] font-mono text-xs">Loading attendance records...</div>
  const allAttendance = data?.data || []
  const pagination = data?.pagination
  const totalCount = data?.total ?? allAttendance.length

  const attendance = allAttendance.filter((a: any) => {
    const matchesSearch = !search || 
      a.employee_name?.toLowerCase().includes(search.toLowerCase()) || 
      a.employee_id?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !filters.status || a.status === filters.status
    return matchesSearch && matchesStatus
  })

  const stats = {
    present: allAttendance.filter((a: any) => a.status === 'PRESENT').length,
    late: allAttendance.filter((a: any) => a.status === 'LATE').length,
    absent: allAttendance.filter((a: any) => a.status === 'ABSENT').length
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[var(--text-main)] leading-tight tracking-tight">Attendance</h1>
          <p className="text-xs font-mono text-[var(--text-muted)] mt-1">ATTENDANCE MANAGEMENT</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded p-1 flex-wrap gap-1">
            <button
              onClick={() => setViewMode('dashboard')}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
                viewMode === 'dashboard' ? 'theme-accent-bg text-white shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Dashboard
            </button>
            {hasRole(['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER']) && (
              <button
                onClick={() => setViewMode('daily')}
                className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
                  viewMode === 'daily' ? 'theme-accent-bg text-white shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                Attendances
              </button>
            )}
            <button
              onClick={() => setViewMode('requests')}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
                viewMode === 'requests' ? 'theme-accent-bg text-white shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Requests
            </button>
            <button
              onClick={() => setViewMode('activity')}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
                viewMode === 'activity' ? 'theme-accent-bg text-white shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Activity Log
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
                viewMode === 'monthly' ? 'theme-accent-bg text-white shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Monthly Summary
            </button>
            {hasRole(['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER']) && (
              <button
                onClick={() => setViewMode('validation')}
                className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
                  viewMode === 'validation' ? 'theme-accent-bg text-white shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                Validation
              </button>
            )}
            {hasRole(['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER']) && (
              <button
                onClick={() => setViewMode('exceptions')}
                className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
                  viewMode === 'exceptions' ? 'theme-accent-bg text-white shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                Exceptions
              </button>
            )}
            {hasRole(['SUPER_ADMIN', 'HR_ADMIN']) && (
              <button
                onClick={() => setViewMode('rules')}
                className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
                  viewMode === 'rules' ? 'theme-accent-bg text-white shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                Rules
              </button>
            )}
          </div>
        </div>
      </div>

      {viewMode === 'dashboard' && <AttendanceDashboardView />}
      {viewMode === 'requests' && <AttendanceRequestsView />}
      {viewMode === 'activity' && <AttendanceActivityView />}
      {viewMode === 'monthly' && <MonthlySummaryConsole />}
      {viewMode === 'validation' && hasRole(['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER']) && <AttendanceValidation />}
      {viewMode === 'exceptions' && hasRole(['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER']) && <ExceptionQueue />}
      {viewMode === 'rules' && hasRole(['SUPER_ADMIN', 'HR_ADMIN']) && <AttendanceRulesConfig />}

      {viewMode === 'daily' && hasRole(['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER']) && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono">
            <Card className="p-5 bg-[var(--bg-card)] border-[var(--border-color)]">
              <p className="text-xs font-mono font-medium text-[var(--text-muted)] uppercase tracking-wider">Total Scheduled</p>
              <h2 className="text-3xl font-mono font-bold text-[var(--text-main)] mt-1">{attendance.length}</h2>
            </Card>
            <Card className="p-5 bg-[var(--bg-card)] border-[var(--border-color)]">
              <p className="text-xs font-mono font-medium text-[var(--text-muted)] uppercase tracking-wider">On Time</p>
              <h2 className="text-3xl font-mono font-bold text-emerald-500 mt-1">{stats.present}</h2>
            </Card>
            <Card className="p-5 bg-[var(--bg-card)] border-[var(--border-color)]">
              <p className="text-xs font-mono font-medium text-[var(--text-muted)] uppercase tracking-wider">Late Arrivals</p>
              <h2 className="text-3xl font-mono font-bold text-amber-500 mt-1">{stats.late}</h2>
            </Card>
            <Card className="p-5 bg-[var(--bg-card)] border-[var(--border-color)]">
              <p className="text-xs font-mono font-medium text-[var(--text-muted)] uppercase tracking-wider">Unexcused Absences</p>
              <h2 className="text-3xl font-mono font-bold text-rose-500 mt-1">{stats.absent}</h2>
            </Card>
          </div>

          <Card className="p-0 overflow-hidden bg-[var(--bg-card)] border-[var(--border-color)]">
            <div className="px-5 py-3 border-b border-[var(--border-color)] bg-[var(--bg-subtle)] flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-color)] px-3 py-1.5 rounded">
                <Search size={14} className="text-[var(--text-muted)]" />
                <input 
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search employees or IDs..."
                  className="bg-transparent border-none focus:outline-none text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] font-mono w-64"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[var(--text-muted)] font-mono text-xs">Filter Status:</label>
                <select
                  value={filters.status || ''}
                  onChange={e => setFilter('status', e.target.value)}
                  className="bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="">All Statuses</option>
                  <option value="PRESENT">PRESENT</option>
                  <option value="LATE">LATE</option>
                  <option value="ABSENT">ABSENT</option>
                </select>
              </div>
            </div>
            <table className="w-full text-left font-sans">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-subtle)]/60">
                  <th className="px-5 py-2.5 text-xs font-mono text-[var(--text-muted)] uppercase">Employee</th>
                  <th className="px-5 py-2.5 text-xs font-mono text-[var(--text-muted)] uppercase text-center">First In</th>
                  <th className="px-5 py-2.5 text-xs font-mono text-[var(--text-muted)] uppercase text-center">Last Out</th>
                  <th className="px-5 py-2.5 text-xs font-mono text-[var(--text-muted)] uppercase text-center">Late By</th>
                  <th className="px-5 py-2.5 text-xs font-mono text-[var(--text-muted)] uppercase text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] text-xs text-[var(--text-main)]">
                {attendance.map((row: any) => (
                  <tr key={row.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                    <td className="px-5 py-3">
                      <div>
                        <div className="font-semibold text-[var(--text-main)]">{row.employee_name}</div>
                        <div className="text-[11px] font-mono text-[var(--text-muted)]">{row.employee_id} • {row.department}</div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center font-mono theme-accent-text">{row.first_in}</td>
                    <td className="px-5 py-3 text-center font-mono theme-accent-text">{row.last_out}</td>
                    <td className="px-5 py-3 text-center">
                      {row.late_by_minutes > 0 ? (
                        <span className="inline-flex items-center gap-1 font-mono text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          <Clock size={11}/> {row.late_by_minutes}m
                        </span>
                      ) : (
                        <span className="text-[var(--text-muted)] font-mono">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono uppercase ${
                        row.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                        row.status === 'LATE' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 
                        'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                      }`}>
                        {row.status === 'PRESENT' && <CheckCircle2 size={11}/>}
                        {row.status === 'LATE' && <AlertCircle size={11}/>}
                        {row.status === 'ABSENT' && <XCircle size={11}/>}
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {attendance.length === 0 && (
              <div className="p-8 text-center text-[var(--text-muted)] font-mono text-xs">No attendance records found.</div>
            )}
            <PaginationBar
              meta={pagination}
              page={page}
              limit={limit}
              total={totalCount}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
          </Card>
        </>
      )}
    </div>
  )
}
