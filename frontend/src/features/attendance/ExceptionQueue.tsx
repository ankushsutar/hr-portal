import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '../../components/ui/Card'
import { AlertCircle, CheckCircle2, XCircle, Clock, ShieldAlert, FileText, Check, X, ShieldCheck } from 'lucide-react'

type ExceptionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WAIVED' | 'ALL'

interface ExceptionItem {
  id: string
  employee_id: string
  employee_code: string
  employee_name: string
  department: string
  attendance_date: string
  exception_type: 'LATE_ARRIVAL' | 'EARLY_DEPARTURE' | 'BOTH' | 'MISSING_PUNCH'
  late_minutes: number
  early_departure_minutes: number
  grace_period_minutes: number
  justification: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WAIVED'
  reviewed_by?: string
  reviewed_at?: string
  review_comments?: string
}

export const ExceptionQueue = () => {
  const qc = useQueryClient()
  const [activeStatus, setActiveStatus] = useState<ExceptionStatus>('PENDING')
  const [selectedException, setSelectedException] = useState<ExceptionItem | null>(null)
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'WAIVE' | null>(null)
  const [reviewComments, setReviewComments] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['attendance-exceptions', activeStatus],
    queryFn: async () => {
      const res = await fetch(`/api/v1/attendance/exceptions?status=${activeStatus}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) {
        if (res.status === 403) throw new Error('Forbidden: Only managers and HR admins can view exceptions.')
        throw new Error('Failed to fetch exceptions queue')
      }
      return res.json()
    }
  })

  const reviewMutation = useMutation({
    mutationFn: async ({ exception_id, action, review_comments }: { exception_id: string, action: string, review_comments: string }) => {
      const res = await fetch('/api/v1/attendance/exceptions/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ exception_id, action, review_comments })
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'Failed to review exception')
      }
      return data
    },
    onSuccess: () => {
      setSelectedException(null)
      setActionType(null)
      setReviewComments('')
      setErrorMsg(null)
      qc.invalidateQueries({ queryKey: ['attendance-exceptions'] })
    },
    onError: (err: any) => {
      setErrorMsg(err.message)
    }
  })

  const items: ExceptionItem[] = data?.data || []

  const handleOpenReview = (item: ExceptionItem, action: 'APPROVE' | 'REJECT' | 'WAIVE') => {
    setSelectedException(item)
    setActionType(action)
    setReviewComments('')
    setErrorMsg(null)
  }

  const submitReview = () => {
    if (!selectedException || !actionType) return
    reviewMutation.mutate({
      exception_id: selectedException.id,
      action: actionType,
      review_comments: reviewComments
    })
  }

  return (
    <div className="space-y-6">
      {/* Header Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveStatus('PENDING')}
            className={`px-4 py-2 rounded text-xs font-mono font-medium transition-all flex items-center gap-2 ${
              activeStatus === 'PENDING'
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <AlertCircle size={14} /> Pending Review
          </button>
          <button
            onClick={() => setActiveStatus('APPROVED')}
            className={`px-4 py-2 rounded text-xs font-mono font-medium transition-all flex items-center gap-2 ${
              activeStatus === 'APPROVED'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <CheckCircle2 size={14} /> Approved / Excused
          </button>
          <button
            onClick={() => setActiveStatus('WAIVED')}
            className={`px-4 py-2 rounded text-xs font-mono font-medium transition-all flex items-center gap-2 ${
              activeStatus === 'WAIVED'
                ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <ShieldCheck size={14} /> Waived
          </button>
          <button
            onClick={() => setActiveStatus('REJECTED')}
            className={`px-4 py-2 rounded text-xs font-mono font-medium transition-all flex items-center gap-2 ${
              activeStatus === 'REJECTED'
                ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <XCircle size={14} /> Rejected
          </button>
          <button
            onClick={() => setActiveStatus('ALL')}
            className={`px-4 py-2 rounded text-xs font-mono font-medium transition-all flex items-center gap-2 ${
              activeStatus === 'ALL'
                ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            All Exceptions
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded text-xs font-mono flex items-center justify-between">
          <span>⚠️ {errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white font-bold">×</button>
        </div>
      )}

      {/* Main Table Card */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 font-mono text-xs">Loading shift exception queue...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-mono text-xs">
            No shift exceptions found in status <span className="text-slate-300 font-semibold">{activeStatus}</span>.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="p-3">Employee</th>
                <th className="p-3">Date</th>
                <th className="p-3">Exception Type</th>
                <th className="p-3">Violation Duration</th>
                <th className="p-3">Employee Justification</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {items.map(row => (
                <tr key={row.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3">
                    <div className="font-semibold text-slate-100">{row.employee_name}</div>
                    <div className="text-[11px] font-mono text-slate-500">{row.employee_code} • {row.department}</div>
                  </td>
                  <td className="p-3 font-mono text-slate-300">{row.attendance_date}</td>
                  <td className="p-3">
                    {row.exception_type === 'LATE_ARRIVAL' && (
                      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-semibold flex items-center gap-1 w-max">
                        <Clock size={11} /> LATE ARRIVAL
                      </span>
                    )}
                    {row.exception_type === 'EARLY_DEPARTURE' && (
                      <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-semibold flex items-center gap-1 w-max">
                        <Clock size={11} /> EARLY OUT
                      </span>
                    )}
                    {row.exception_type === 'BOTH' && (
                      <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-semibold flex items-center gap-1 w-max">
                        <ShieldAlert size={11} /> LATE + EARLY OUT
                      </span>
                    )}
                    {row.exception_type === 'MISSING_PUNCH' && (
                      <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-semibold flex items-center gap-1 w-max">
                        <AlertCircle size={11} /> MISSING PUNCH
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-mono">
                    {row.late_minutes > 0 && (
                      <div className="text-amber-400 font-medium">Late: +{row.late_minutes} mins</div>
                    )}
                    {row.early_departure_minutes > 0 && (
                      <div className="text-purple-400 font-medium">Early Out: -{row.early_departure_minutes} mins</div>
                    )}
                    {row.late_minutes === 0 && row.early_departure_minutes === 0 && (
                      <span className="text-slate-500">--</span>
                    )}
                  </td>
                  <td className="p-3">
                    {row.justification ? (
                      <div className="text-slate-300 italic max-w-xs truncate" title={row.justification}>
                        "{row.justification}"
                      </div>
                    ) : (
                      <span className="text-slate-500 italic text-[11px]">No justification submitted</span>
                    )}
                  </td>
                  <td className="p-3">
                    {row.status === 'PENDING' && (
                      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-semibold">
                        PENDING
                      </span>
                    )}
                    {row.status === 'APPROVED' && (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-semibold">
                        APPROVED
                      </span>
                    )}
                    {row.status === 'WAIVED' && (
                      <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-semibold">
                        WAIVED
                      </span>
                    )}
                    {row.status === 'REJECTED' && (
                      <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-semibold">
                        REJECTED
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {row.status === 'PENDING' && (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenReview(row, 'APPROVE')}
                          className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded text-[11px] font-mono font-medium flex items-center gap-1"
                        >
                          <Check size={12} /> Excuse
                        </button>
                        <button
                          onClick={() => handleOpenReview(row, 'WAIVE')}
                          className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border border-purple-500/30 px-2 py-1 rounded text-[11px] font-mono font-medium flex items-center gap-1"
                        >
                          Waive
                        </button>
                        <button
                          onClick={() => handleOpenReview(row, 'REJECT')}
                          className="bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-500/30 px-2 py-1 rounded text-[11px] font-mono font-medium flex items-center gap-1"
                        >
                          <X size={12} /> Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Review Modal */}
      {selectedException && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0D1322] border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <FileText size={20} className="text-blue-400" />
              Review Shift Exception ({actionType})
            </h3>
            <div className="text-xs text-slate-400 space-y-1 font-mono bg-slate-900/60 p-3 rounded border border-slate-800">
              <div><strong className="text-slate-200">Employee:</strong> {selectedException.employee_name} ({selectedException.employee_code})</div>
              <div><strong className="text-slate-200">Date:</strong> {selectedException.attendance_date}</div>
              <div><strong className="text-slate-200">Violation:</strong> {selectedException.exception_type} (Late: {selectedException.late_minutes}m, Early: {selectedException.early_departure_minutes}m)</div>
              {selectedException.justification && (
                <div><strong className="text-slate-200">Employee Note:</strong> "{selectedException.justification}"</div>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Manager Audit Remarks:</label>
              <textarea
                value={reviewComments}
                onChange={e => setReviewComments(e.target.value)}
                placeholder="Enter mandatory audit comments for exception review..."
                rows={3}
                className="w-full bg-[#070A12] border border-slate-800 rounded p-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => { setSelectedException(null); setActionType(null) }}
                className="px-4 py-1.5 rounded text-xs font-mono text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={submitReview}
                disabled={reviewMutation.isPending}
                className="px-4 py-1.5 rounded text-xs font-mono font-medium bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
              >
                {reviewMutation.isPending ? 'Submitting...' : 'Confirm Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
