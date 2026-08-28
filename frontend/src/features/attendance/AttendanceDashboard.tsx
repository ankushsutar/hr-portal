import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '../../components/ui/Card'
import { Clock, CheckCircle2, XCircle, AlertCircle, Search, Calendar as CalendarIcon, UserPlus } from 'lucide-react'

export const AttendanceDashboard = () => {
  const qc = useQueryClient()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isPunchModalOpen, setIsPunchModalOpen] = useState(false)
  const [punchEmployee, setPunchEmployee] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['attendance-daily', date],
    queryFn: async () => {
      const res = await fetch(`/api/v1/attendance/daily?date=${date}`, {
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
      alert('Manual punch recorded.')
    }
  })

  if (isLoading) return <div className="p-8 text-gray-500">Loading attendance...</div>
  const attendance = data?.data || []

  const stats = {
    present: attendance.filter((a: any) => a.status === 'PRESENT').length,
    late: attendance.filter((a: any) => a.status === 'LATE').length,
    absent: attendance.filter((a: any) => a.status === 'ABSENT').length
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-bold text-gray-900 leading-[36px] tracking-tight">Daily Attendance</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor organization-wide attendance, late arrivals, and manual punches.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 pl-3 text-gray-500">
            <CalendarIcon size={16} />
          </div>
          <input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)}
            className="border-none focus:ring-0 text-sm font-medium outline-none p-2 bg-transparent text-gray-700"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 bg-white border border-gray-100 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Headcount</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">{attendance.length}</h2>
          </div>
        </Card>
        <Card className="p-6 bg-green-50/50 border border-green-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-600 uppercase tracking-wide">On Time</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">{stats.present}</h2>
          </div>
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-green-500">
            <CheckCircle2 size={24} />
          </div>
        </Card>
        <Card className="p-6 bg-orange-50/50 border border-orange-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-orange-600 uppercase tracking-wide">Late Today</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">{stats.late}</h2>
          </div>
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-orange-500">
            <Clock size={24} />
          </div>
        </Card>
        <Card className="p-6 bg-red-50/50 border border-red-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-600 uppercase tracking-wide">Absent</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">{stats.absent}</h2>
          </div>
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-red-500">
            <XCircle size={24} />
          </div>
        </Card>
      </div>

      <Card className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Search size={18} className="text-gray-400" />
            <input 
              type="text"
              placeholder="Search employees..."
              className="bg-transparent border-none focus:ring-0 text-sm outline-none w-64"
            />
          </div>
          <button 
            onClick={() => setIsPunchModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <UserPlus size={16} /> Manual Punch
          </button>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/20">
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">First In</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Last Out</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Late By</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {attendance.map((row: any) => (
              <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-900">{row.employee_name}</div>
                    <div className="text-xs text-gray-500">{row.employee_id} • {row.department}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center font-medium font-mono text-sm text-gray-700">{row.first_in}</td>
                <td className="px-6 py-4 text-center font-medium font-mono text-sm text-gray-700">{row.last_out}</td>
                <td className="px-6 py-4 text-center">
                  {row.late_by_minutes > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">
                      <Clock size={12}/> {row.late_by_minutes}m
                    </span>
                  ) : (
                    <span className="text-gray-300">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    row.status === 'PRESENT' ? 'bg-green-50 text-green-700' : 
                    row.status === 'LATE' ? 'bg-orange-50 text-orange-700' : 
                    'bg-red-50 text-red-700'
                  }`}>
                    {row.status === 'PRESENT' && <CheckCircle2 size={12}/>}
                    {row.status === 'LATE' && <AlertCircle size={12}/>}
                    {row.status === 'ABSENT' && <XCircle size={12}/>}
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {attendance.length === 0 && (
          <div className="p-12 text-center text-gray-500">No attendance records for this date.</div>
        )}
      </Card>

      {isPunchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-fade-in relative">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Manual Punch</h3>
              <button onClick={() => setIsPunchModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                <input 
                  type="text" 
                  value={punchEmployee}
                  onChange={(e) => setPunchEmployee(e.target.value)}
                  placeholder="e.g. EMP-001" 
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-mono uppercase"
                />
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    manualPunch.mutate({ employee_id: punchEmployee || 'EMP-MANUAL', provider: 'MANUAL', punch_type: 'IN' })
                    setIsPunchModalOpen(false)
                  }}
                  className="flex-1 bg-green-50 text-green-700 font-semibold border border-green-200 py-2 rounded-md hover:bg-green-100"
                >
                  Punch IN
                </button>
                <button 
                  onClick={() => {
                    manualPunch.mutate({ employee_id: punchEmployee || 'EMP-MANUAL', provider: 'MANUAL', punch_type: 'OUT' })
                    setIsPunchModalOpen(false)
                  }}
                  className="flex-1 bg-red-50 text-red-700 font-semibold border border-red-200 py-2 rounded-md hover:bg-red-100"
                >
                  Punch OUT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
