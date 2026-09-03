import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '../../components/ui/Card'
import { CheckCircle2, AlertCircle, MapPin, Briefcase, Home, CalendarPlus, XCircle } from 'lucide-react'

export const MyAttendance = () => {
  const qc = useQueryClient()
  const [requestModal, setRequestModal] = useState<{type: string, open: boolean}>({ type: '', open: false })
  const [requestData, setRequestData] = useState({ date: '', reason: '' })

  const { data: attendanceData, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: async () => {
      const res = await fetch(`/api/v1/attendance/daily`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to fetch attendance')
      return res.json()
    }
  })

  const { data: requestsData, isLoading: isLoadingRequests } = useQuery({
    queryKey: ['my-attendance-requests'],
    queryFn: async () => {
      const res = await fetch(`/api/v1/attendance/requests/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to fetch requests')
      return res.json()
    }
  })

  const submitRequest = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/attendance/requests', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ type: requestModal.type, ...requestData })
      })
      if (!res.ok) throw new Error('Request failed')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-attendance-requests'] })
      setRequestModal({ type: '', open: false })
      setRequestData({ date: '', reason: '' })
    }
  })

  if (isLoadingAttendance || isLoadingRequests) {
    return <div className="p-8 text-[var(--text-muted)] font-mono text-xs animate-pulse">Loading attendance console...</div>
  }
  const myLogs = [attendanceData?.data?.[0]]
  const myRequests = requestsData?.data || []

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[var(--text-main)] leading-tight tracking-tight">My Attendance</h1>
          <p className="text-xs text-[var(--text-muted)] font-mono mt-1">PERSONAL PUNCH HISTORY & ANOMALY REQUESTS</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setRequestModal({ type: 'WFH', open: true })}
            className="flex items-center gap-1.5 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] border border-[var(--border-color)] px-3 py-1.5 rounded text-xs font-medium transition-colors"
          >
            <Home size={14} /> Request WFH
          </button>
          <button 
            onClick={() => setRequestModal({ type: 'OD', open: true })}
            className="flex items-center gap-1.5 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] border border-[var(--border-color)] px-3 py-1.5 rounded text-xs font-medium transition-colors"
          >
            <Briefcase size={14} /> Request OD
          </button>
          <button 
            onClick={() => setRequestModal({ type: 'COMP_OFF', open: true })}
            className="flex items-center gap-1.5 theme-accent-bg hover:opacity-90 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors shadow-sm"
          >
            <CalendarPlus size={14} /> Earn Comp-off
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
          <p className="text-xs font-mono font-medium text-[var(--text-muted)] uppercase tracking-wider">Present Days</p>
          <h2 className="text-3xl font-mono font-bold text-[var(--text-main)] mt-1">18</h2>
        </Card>
        <Card className="p-5 bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
          <p className="text-xs font-mono font-medium text-[var(--text-muted)] uppercase tracking-wider">Late Marks</p>
          <h2 className="text-3xl font-mono font-bold text-amber-500 mt-1">2</h2>
        </Card>
        <Card className="p-5 bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
          <p className="text-xs font-mono font-medium text-[var(--text-muted)] uppercase tracking-wider">Comp-off Balance</p>
          <h2 className="text-3xl font-mono font-bold theme-accent-text mt-1">1.5</h2>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-0 overflow-hidden bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
          <div className="px-5 py-3 border-b border-[var(--border-color)] bg-[var(--bg-subtle)]">
            <h3 className="font-semibold text-[var(--text-main)] text-sm">Recent Punches</h3>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-subtle)]">
                <th className="px-5 py-2.5 text-xs font-mono text-[var(--text-muted)] uppercase">Date</th>
                <th className="px-5 py-2.5 text-xs font-mono text-[var(--text-muted)] uppercase">In/Out</th>
                <th className="px-5 py-2.5 text-xs font-mono text-[var(--text-muted)] uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] text-xs text-[var(--text-main)]">
              {myLogs.filter(Boolean).map((log: any, idx: number) => (
                <tr key={idx} className="hover:bg-[var(--bg-subtle)] transition-colors">
                  <td className="px-5 py-3 font-mono text-[var(--text-main)]">{log.date}</td>
                  <td className="px-5 py-3 text-[var(--text-main)]">
                    <div className="font-mono theme-accent-text font-semibold">{log.first_in} - {log.last_out}</div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-0.5 flex items-center gap-1"><MapPin size={11}/> HQ Office</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono uppercase ${
                      log.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    }`}>
                      {log.status === 'PRESENT' ? <CheckCircle2 size={11}/> : <AlertCircle size={11}/>}
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-0 overflow-hidden bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
          <div className="px-5 py-3 border-b border-[var(--border-color)] bg-[var(--bg-subtle)]">
            <h3 className="font-semibold text-[var(--text-main)] text-sm">My Requests</h3>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-subtle)]">
                <th className="px-5 py-2.5 text-xs font-mono text-[var(--text-muted)] uppercase">Type</th>
                <th className="px-5 py-2.5 text-xs font-mono text-[var(--text-muted)] uppercase">Date</th>
                <th className="px-5 py-2.5 text-xs font-mono text-[var(--text-muted)] uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] text-xs text-[var(--text-main)]">
              {myRequests.map((req: any, idx: number) => (
                <tr key={idx} className="hover:bg-[var(--bg-subtle)] transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-mono font-semibold text-[var(--text-main)]">{req.type}</div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate max-w-[160px]" title={req.reason}>{req.reason}</div>
                  </td>
                  <td className="px-5 py-3 font-mono text-[var(--text-muted)]">{req.date}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono uppercase ${
                      req.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                </tr>
              ))}
              {myRequests.length === 0 && (
                <tr><td colSpan={3} className="p-6 text-center text-[var(--text-muted)] font-mono text-xs">No requests logged.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>

      {requestModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in text-[var(--text-main)]">
            <div className="px-5 py-3 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-subtle)]">
              <h3 className="font-semibold text-[var(--text-main)] text-sm">
                {requestModal.type === 'OD' ? 'Request On Duty (OD)' : 
                 requestModal.type === 'WFH' ? 'Request Work From Home' : 'Earn Comp-off'}
              </h3>
              <button onClick={() => setRequestModal({ type: '', open: false })} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                <XCircle size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-mono text-[var(--text-muted)] mb-1">Target Date</label>
                <input 
                  type="date" 
                  value={requestData.date}
                  onChange={(e) => setRequestData({...requestData, date: e.target.value})}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded p-2 text-[var(--text-main)] focus:border-[var(--color-primary)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-mono text-[var(--text-muted)] mb-1">Reason / Justification</label>
                <textarea 
                  value={requestData.reason}
                  onChange={(e) => setRequestData({...requestData, reason: e.target.value})}
                  placeholder="Explain why this request is needed..." 
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded p-2 text-[var(--text-main)] focus:border-[var(--color-primary)] focus:outline-none min-h-[90px] resize-none placeholder-[var(--text-muted)]"
                />
              </div>
              <div className="pt-2">
                <button 
                  onClick={() => submitRequest.mutate()}
                  className="w-full theme-accent-bg hover:opacity-90 text-white font-medium py-2 rounded text-xs transition-colors shadow-sm"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
