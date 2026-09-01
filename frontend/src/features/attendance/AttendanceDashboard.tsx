import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '../../components/ui/Card'
import { PaginationBar } from '../../components/ui/PaginationBar'
import { useTableState } from '../../hooks/useTableState'
import { Clock, CheckCircle2, XCircle, AlertCircle, Search, Calendar as CalendarIcon, UserPlus, ShieldCheck, ListFilter } from 'lucide-react'
import { AttendanceValidation } from './AttendanceValidation'

export const AttendanceDashboard = () => {
  const qc = useQueryClient()
  const [viewMode, setViewMode] = useState<'daily' | 'validation'>('daily')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isPunchModalOpen, setIsPunchModalOpen] = useState(false)
  const [punchEmployee, setPunchEmployee] = useState('')

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

  const manualPunch = useMutation({
    mutationFn: async (punchData: any) => {
      const res = await fetch('/api/v1/attendance/punch', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify(punchData)
      })
      if (!res.ok) throw new Error('Punch failed')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance-daily'] })
    }
  })

  if (isLoading) return <div className="p-8 text-slate-500 font-mono text-xs">Loading attendance records...</div>
  const allAttendance = data?.data || []
  const pagination = data?.pagination
  const totalCount = data?.total ?? allAttendance.length

  // Filter client-side if backend returns non-paginated or fallback
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-slate-100 leading-tight tracking-tight">Daily Attendance Console</h1>
          <p className="text-xs font-mono text-slate-400 mt-1">ORGANIZATION PUNCH MONITORING & 3-STAGE VALIDATION</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#111827] border border-slate-800 rounded p-1">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'daily' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListFilter size={13} /> Punch Monitor
            </button>
            <button
              onClick={() => setViewMode('validation')}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'validation' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck size={13} /> 3-Stage Validation
            </button>
          </div>
          {viewMode === 'daily' && (
            <>
              <div className="flex items-center gap-2 bg-[#111827] border border-slate-800 px-3 py-1.5 rounded text-xs">
                <CalendarIcon size={14} className="text-slate-400" />
                <input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)}
                  className="bg-transparent border-none focus:outline-none text-slate-200 font-mono"
                />
              </div>
              <button 
                onClick={() => setIsPunchModalOpen(true)}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
              >
                <UserPlus size={14} /> Manual Punch
              </button>
            </>
          )}
        </div>
      </div>

      {viewMode === 'validation' ? (
        <AttendanceValidation />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-5">
              <p className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">Total Scheduled</p>
              <h2 className="text-3xl font-mono font-bold text-slate-100 mt-1">{attendance.length}</h2>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">On Time</p>
              <h2 className="text-3xl font-mono font-bold text-emerald-400 mt-1">{stats.present}</h2>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">Late Arrivals</p>
              <h2 className="text-3xl font-mono font-bold text-amber-400 mt-1">{stats.late}</h2>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">Unexcused Absences</p>
              <h2 className="text-3xl font-mono font-bold text-rose-400 mt-1">{stats.absent}</h2>
            </Card>
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-[#0B0F19] border border-slate-800 px-3 py-1.5 rounded">
                <Search size={14} className="text-slate-500" />
                <input 
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search employees or IDs..."
                  className="bg-transparent border-none focus:outline-none text-xs text-slate-200 placeholder-slate-500 font-mono w-64"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-slate-400 font-mono text-xs">Filter Status:</label>
                <select
                  value={filters.status || ''}
                  onChange={e => setFilter('status', e.target.value)}
                  className="bg-[#0B0F19] border border-slate-800 text-slate-200 rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="PRESENT">PRESENT</option>
                  <option value="LATE">LATE</option>
                  <option value="ABSENT">ABSENT</option>
                </select>
              </div>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/40">
                  <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase">Employee</th>
                  <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase text-center">First In</th>
                  <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase text-center">Last Out</th>
                  <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase text-center">Late By</th>
                  <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {attendance.map((row: any) => (
                  <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3">
                      <div>
                        <div className="font-semibold text-slate-200">{row.employee_name}</div>
                        <div className="text-[11px] font-mono text-slate-500">{row.employee_id} • {row.department}</div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center font-mono text-blue-300">{row.first_in}</td>
                    <td className="px-5 py-3 text-center font-mono text-blue-300">{row.last_out}</td>
                    <td className="px-5 py-3 text-center">
                      {row.late_by_minutes > 0 ? (
                        <span className="inline-flex items-center gap-1 font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          <Clock size={11}/> {row.late_by_minutes}m
                        </span>
                      ) : (
                        <span className="text-slate-600 font-mono">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono uppercase ${
                        row.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                        row.status === 'LATE' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
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
              <div className="p-8 text-center text-slate-500 font-mono text-xs">No attendance records found.</div>
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

          {isPunchModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="bg-[#111827] rounded-lg border border-slate-800 shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                  <h3 className="font-semibold text-slate-100 text-sm">Manual Override Punch</h3>
                  <button onClick={() => setIsPunchModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                    <XCircle size={18} />
                  </button>
                </div>
                <div className="p-5 space-y-4 text-xs">
                  <div>
                    <label className="block font-mono text-slate-400 mb-1">Employee ID</label>
                    <input 
                      type="text" 
                      value={punchEmployee}
                      onChange={(e) => setPunchEmployee(e.target.value)}
                      placeholder="e.g. EMP-001" 
                      className="w-full bg-[#0B0F19] border border-slate-800 rounded p-2 text-slate-200 focus:border-blue-500 focus:outline-none font-mono uppercase"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        manualPunch.mutate({ employee_id: punchEmployee || 'EMP-MANUAL', provider: 'MANUAL', punch_type: 'IN' })
                        setIsPunchModalOpen(false)
                      }}
                      className="flex-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 py-2 rounded font-mono font-medium transition-colors"
                    >
                      PUNCH IN
                    </button>
                    <button 
                      onClick={() => {
                        manualPunch.mutate({ employee_id: punchEmployee || 'EMP-MANUAL', provider: 'MANUAL', punch_type: 'OUT' })
                        setIsPunchModalOpen(false)
                      }}
                      className="flex-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 py-2 rounded font-mono font-medium transition-colors"
                    >
                      PUNCH OUT
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
