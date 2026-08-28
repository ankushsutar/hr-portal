
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, Search, Filter } from 'lucide-react'

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
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-bold text-gray-900 leading-[36px] tracking-tight">Inbox</h1>
          <p className="text-sm text-gray-500 mt-1">Review and manage pending employee requests.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-md border border-gray-200 shadow-sm">
            <Search size={16} className="text-gray-400" />
            <input 
              type="text"
              placeholder="Filter by employee..."
              className="bg-transparent border-none focus:ring-0 text-sm outline-none w-64"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors">
            <Filter size={16} /> Filters
          </button>
        </div>
        
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading your inbox...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <CheckCircle className="w-12 h-12 text-green-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
            <p className="text-gray-500 text-sm mt-1">You have no pending requests.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/20">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Request Type</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Reason</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {requests.map((req: any) => (
                <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{req.employee_name}</div>
                    <div className="text-xs text-gray-500">{req.department}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
                      {req.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-[300px]">
                    <div className="text-sm font-medium text-gray-900">{req.date}</div>
                    <div className="text-xs text-gray-500 mt-1 truncate" title={req.reason}>{req.reason}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => approveReq.mutate(req.id)}
                        disabled={approveReq.isPending}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-md text-sm font-semibold hover:bg-green-100 transition-colors border border-green-200"
                      >
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button 
                        onClick={() => rejectReq.mutate(req.id)}
                        disabled={rejectReq.isPending}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-md text-sm font-semibold hover:bg-red-100 transition-colors border border-red-200"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
