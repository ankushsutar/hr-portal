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
    <div className="space-y-6 font-sans">
      {/* Header Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[var(--border-color)] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveStatus('PENDING')}
            className={`px-4 py-2 rounded text-xs font-mono font-medium transition-all flex items-center gap-2 ${
              activeStatus === 'PENDING'
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-500 shadow-sm font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]'
            }`}
          >
            <AlertCircle size={14} /> Pending Review
          </button>
          <button
            onClick={() => setActiveStatus('APPROVED')}
            className={`px-4 py-2 rounded text-xs font-mono font-medium transition-all flex items-center gap-2 ${
              activeStatus === 'APPROVED'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 shadow-sm font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]'
            }`}
          >
            <CheckCircle2 size={14} /> Approved / Excused
          </button>
          <button
            onClick={() => setActiveStatus('WAIVED')}
            className={`px-4 py-2 rounded text-xs font-mono font-medium transition-all flex items-center gap-2 ${
              activeStatus === 'WAIVED'
                ? 'bg-purple-500/10 border border-purple-500/30 text-purple-500 shadow-sm font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]'
            }`}
          >
            <ShieldCheck size={14} /> Waived
          </button>
          <button
            onClick={() => setActiveStatus('REJECTED')}
            className={`px-4 py-2 rounded text-xs font-mono font-medium transition-all flex items-center gap-2 ${
              activeStatus === 'REJECTED'
                ? 'bg-rose-500/10 border border-rose-500/30 text-rose-500 shadow-sm font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]'
            }`}
          >
            <XCircle size={14} /> Rejected
          </button>
          <button
            onClick={() => setActiveStatus('ALL')}
            className={`px-4 py-2 rounded text-xs font-mono font-medium transition-all flex items-center gap-2 ${
              activeStatus === 'ALL'
                ? 'bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 theme-accent-text shadow-sm font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]'
            }`}
          >
            All Exceptions
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3 rounded text-xs font-mono flex items-center justify-between">
          <span>⚠️ {errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700 font-bold">×</button>
        </div>
      )}

      {/* Main Table Card */}
      <Card className="p-0 overflow-hidden bg-[var(--bg-card)] border-[var(--border-color)]">
        {isLoading ? (
          <div className="p-8 text-center text-[var(--text-muted)] font-mono text-xs">Loading shift exception queue...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-[var(--text-muted)] font-mono text-xs">
            No shift exceptions found in status <span className="text-[var(--text-main)] font-semibold">{activeStatus}</span>.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-muted)] font-mono text-[11px] uppercase tracking-wider">
                <th className="p-3">Employee</th>
                <th className="p-3">Date</th>
                <th className="p-3">Exception Type</th>
                <th className="p-3">Violation Duration</th>
                <th className="p-3">Employee Justification</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] text-xs text-[var(--text-main)]">
              {items.map(row => (
                <tr key={row.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                  <td className="p-3">
                    <div className="font-semibold text-[var(--text-main)]">{row.employee_name}</div>
                    <div className="text-[11px] font-mono text-[var(--text-muted)]">{row.employee_code} • {row.department}</div>
                  </td>
                  <td className="p-3 font-mono text-[var(--text-muted)]">{row.attendance_date}</td>
                  <td className="p-3">
                    {row.exception_type === 'LATE_ARRIVAL' && (
                      <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-semibold flex items-center gap-1 w-max">
                        <Clock size={11} /> LATE ARRIVAL
                      </span>
                    )}
                    {row.exception_type === 'EARLY_DEPARTURE' && (
                      <span className="bg-purple-500/10 text-purple-500 border border-purple-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-semibold flex items-center gap-1 w-max">
                        <Clock size={11} /> EARLY OUT
                      </span>
                    )}
                    {row.exception_type === 'BOTH' && (
                      <span className="bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-semibold flex items-center gap-1 w-max">
                        <ShieldAlert size={11} /> LATE + EARLY OUT
                      </span>
                    )}
                    {row.exception_type === 'MISSING_PUNCH' && (
                      <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-semibold flex items-center gap-1 w-max">
                        <AlertCircle size={11} /> MISSING PUNCH
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-mono">
                    {row.late_minutes > 0 && (
                      <div className="text-amber-500 font-medium">Late: +{row.late_minutes} mins</div>
                    )}
                    {row.early_departure_minutes > 0 && (
                      <div className="text-purple-500 font-medium">Early Out: -{row.early_departure_minutes} mins</div>
                    )}
                    {row.late_minutes === 0 && row.early_departure_minutes === 0 && (
                      <span className="text-[var(--text-muted)]">--</span>
                    )}
                  </td>
                  <td className="p-3">
                    {row.justification ? (
                      <div className="text-[var(--text-main)] italic max-w-xs truncate" title={row.justification}>
                        "{row.justification}"
                      </div>
                    ) : (
                      <span className="text-[var(--text-muted)] italic text-[11px]">No justification submitted</span>
                    )}
                  </td>
                  <td className="p-3">
                    {row.status === 'PENDING' && (
                      <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-semibold">
                        PENDING
                      </span>
                    )}
                    {row.status === 'APPROVED' && (
                      <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-semibold">
                        APPROVED
                      </span>
                    )}
                    {row.status === 'WAIVED' && (
                      <span className="bg-purple-500/10 text-purple-500 border border-purple-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-semibold">
                        WAIVED
                      </span>
                    )}
                    {row.status === 'REJECTED' && (
                      <span className="bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-semibold">
                        REJECTED
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {row.status === 'PENDING' && (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenReview(row, 'APPROVE')}
                          className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-500 border border-emerald-500/30 px-2 py-1 rounded text-[11px] font-mono font-medium flex items-center gap-1"
                        >
                          <Check size={12} /> Excuse
                        </button>
                        <button
                          onClick={() => handleOpenReview(row, 'WAIVE')}
                          className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-500 border border-purple-500/30 px-2 py-1 rounded text-[11px] font-mono font-medium flex items-center gap-1"
                        >
                          Waive
                        </button>
                        <button
                          onClick={() => handleOpenReview(row, 'REJECT')}
                          className="bg-rose-600/20 hover:bg-rose-600/40 text-rose-500 border border-rose-500/30 px-2 py-1 rounded text-[11px] font-mono font-medium flex items-center gap-1"
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in font-mono">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl text-[var(--text-main)]">
            <h3 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
              <FileText size={20} className="theme-accent-text" />
              Review Shift Exception ({actionType})
            </h3>
            <div className="text-xs text-[var(--text-muted)] space-y-1 font-mono bg-[var(--bg-subtle)] p-3 rounded border border-[var(--border-color)]">
              <div><strong className="text-[var(--text-main)]">Employee:</strong> {selectedException.employee_name} ({selectedException.employee_code})</div>
              <div><strong className="text-[var(--text-main)]">Date:</strong> {selectedException.attendance_date}</div>
              <div><strong className="text-[var(--text-main)]">Violation:</strong> {selectedException.exception_type} (Late: {selectedException.late_minutes}m, Early: {selectedException.early_departure_minutes}m)</div>
              {selectedException.justification && (
                <div><strong className="text-[var(--text-main)]">Employee Note:</strong> "{selectedException.justification}"</div>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono text-[var(--text-muted)] mb-1">Manager Audit Remarks:</label>
              <textarea
                value={reviewComments}
                onChange={e => setReviewComments(e.target.value)}
                placeholder="Enter mandatory audit comments for exception review..."
                rows={3}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded p-2 text-xs text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => { setSelectedException(null); setActionType(null) }}
                className="px-4 py-1.5 rounded text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                Cancel
              </button>
              <button
                onClick={submitReview}
                disabled={reviewMutation.isPending}
                className="px-4 py-1.5 rounded text-xs font-mono font-medium theme-accent-bg hover:opacity-90 text-white disabled:opacity-50 shadow-sm"
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
