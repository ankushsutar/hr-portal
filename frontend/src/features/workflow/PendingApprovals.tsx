import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, Search, Filter } from 'lucide-react'
import { Card } from '../../components/ui/Card'

export const PendingApprovals = () => {
  const qc = useQueryClient()
  
  const { data, isLoading } = useQuery({ 
    queryKey: ['pending-requests'], 
    queryFn: async () => {
      const res = await fetch('/api/v1/attendance/requests/pending', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to fetch requests')
      return res.json()
    }
  })

  const approveReq = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/attendance/requests/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Approval failed')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pending-requests'] })
  })

  const rejectReq = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/attendance/requests/${id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Rejection failed')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pending-requests'] })
  })

  const requests = data?.data || []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-slate-100 leading-tight tracking-tight">Pending Approval Inbox</h1>
          <p className="text-xs font-mono text-slate-400 mt-1">APPROVAL WORKFLOW QUEUE & EXCEPTION QUEUE</p>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Search size={14} className="text-slate-500" />
            <input 
              type="text"
              placeholder="Filter by employee name or ID..."
              className="bg-transparent border-none focus:outline-none text-xs text-slate-200 placeholder-slate-500 font-mono w-64"
            />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded text-xs font-mono hover:bg-slate-700 transition-colors">
            <Filter size={13} /> Filters
          </button>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 font-mono text-xs">Loading queue...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <CheckCircle className="w-10 h-10 text-emerald-400 mb-3" />
            <h3 className="text-sm font-semibold text-slate-200">Inbox Zero</h3>
            <p className="text-slate-500 text-xs font-mono mt-1">No pending requests requiring your action.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40">
                <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase">Employee</th>
                <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase">Type</th>
                <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase">Target Date & Justification</th>
                <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {requests.map((req: any) => (
                <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-slate-200">{req.employee_name}</div>
                    <div className="text-[11px] font-mono text-slate-500">{req.department}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-mono font-bold uppercase">
                      {req.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 max-w-[320px]">
                    <div className="font-mono text-slate-300 font-medium">{req.date}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate" title={req.reason}>{req.reason}</div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => approveReq.mutate(req.id)}
                        disabled={approveReq.isPending}
                        className="flex items-center gap-1 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-xs font-mono font-semibold hover:bg-emerald-500/20 transition-colors"
                      >
                        <CheckCircle size={12} /> Approve
                      </button>
                      <button 
                        onClick={() => rejectReq.mutate(req.id)}
                        disabled={rejectReq.isPending}
                        className="flex items-center gap-1 px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded text-xs font-mono font-semibold hover:bg-rose-500/20 transition-colors"
                      >
                        <XCircle size={12} /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
