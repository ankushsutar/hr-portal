import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '../../components/ui/Card'
import { CheckCircle2, XCircle, AlertCircle, Clock, ShieldCheck, CheckSquare, Square } from 'lucide-react'

type ValidationStatus = 'TO_VALIDATE' | 'OT_PENDING' | 'VALIDATED' | 'REJECTED'

interface ValidationItem {
  id: string
  employee_id: string
  employee_code: string
  employee_name: string
  department: string
  date: string
  shift_name: string
  check_in_time: string
  check_out_time: string
  worked_hours: number
  expected_hours: number
  ot_hours: number
  validation_status: ValidationStatus
  validation_comments: string
  validated_by?: string
  validated_at?: string
}

export const AttendanceValidation = () => {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<ValidationStatus>('TO_VALIDATE')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [comments, setComments] = useState('')
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<'VALIDATE' | 'REJECT' | 'APPROVE_OT' | 'REJECT_OT' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['attendance-validation-queue', activeTab],
    queryFn: async () => {
      const res = await fetch(`/api/v1/attendance/validation-queue?validation_status=${activeTab}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) {
        if (res.status === 403) throw new Error('Forbidden: Only Managers & HR Admins can access validation queue.')
        throw new Error('Failed to fetch validation queue')
      }
      return res.json()
    }
  })

  const batchMutation = useMutation({
    mutationFn: async ({ ids, action, comments }: { ids: string[], action: string, comments: string }) => {
      const res = await fetch('/api/v1/attendance/validate-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ids, action, comments })
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || data?.message || 'Validation action failed')
      }
      return data
    },
    onSuccess: () => {
      setSelectedIds([])
      setComments('')
      setIsCommentModalOpen(false)
      setPendingAction(null)
      setActionError(null)
      qc.invalidateQueries({ queryKey: ['attendance-validation-queue'] })
      qc.invalidateQueries({ queryKey: ['attendance-daily'] })
    },
    onError: (err: any) => {
      setActionError(err.message)
    }
  })

  const queue: ValidationItem[] = data?.data || []

  const toggleSelectAll = () => {
    if (selectedIds.length === queue.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(queue.map(q => q.id))
    }
  }

  const toggleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const triggerAction = (action: 'VALIDATE' | 'REJECT' | 'APPROVE_OT' | 'REJECT_OT') => {
    if (selectedIds.length === 0) return
    setPendingAction(action)
    setIsCommentModalOpen(true)
  }

  const confirmAction = () => {
    if (!pendingAction || selectedIds.length === 0) return
    batchMutation.mutate({
      ids: selectedIds,
      action: pendingAction,
      comments: comments
    })
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[var(--border-color)] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setActiveTab('TO_VALIDATE'); setSelectedIds([]) }}
            className={`px-4 py-2 rounded text-xs font-mono font-medium transition-all flex items-center gap-2 ${
              activeTab === 'TO_VALIDATE'
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-500 shadow-sm font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]'
            }`}
          >
            <Clock size={14} /> To Validate
          </button>
          <button
            onClick={() => { setActiveTab('OT_PENDING'); setSelectedIds([]) }}
            className={`px-4 py-2 rounded text-xs font-mono font-medium transition-all flex items-center gap-2 ${
              activeTab === 'OT_PENDING'
                ? 'bg-purple-500/10 border border-purple-500/30 text-purple-500 shadow-sm font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]'
            }`}
          >
            <AlertCircle size={14} /> OT Attendances
          </button>
          <button
            onClick={() => { setActiveTab('VALIDATED'); setSelectedIds([]) }}
            className={`px-4 py-2 rounded text-xs font-mono font-medium transition-all flex items-center gap-2 ${
              activeTab === 'VALIDATED'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 shadow-sm font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]'
            }`}
          >
            <CheckCircle2 size={14} /> Validated
          </button>
          <button
            onClick={() => { setActiveTab('REJECTED'); setSelectedIds([]) }}
            className={`px-4 py-2 rounded text-xs font-mono font-medium transition-all flex items-center gap-2 ${
              activeTab === 'REJECTED'
                ? 'bg-rose-500/10 border border-rose-500/30 text-rose-500 shadow-sm font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]'
            }`}
          >
            <XCircle size={14} /> Rejected
          </button>
        </div>

        {/* Action Toolbar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-color)] px-3 py-1.5 rounded animate-fade-in shadow-sm">
            <span className="text-xs font-mono text-[var(--text-main)] font-semibold">{selectedIds.length} Selected</span>
            <div className="h-4 w-px bg-[var(--border-color)] mx-1" />
            {activeTab === 'TO_VALIDATE' && (
              <>
                <button
                  onClick={() => triggerAction('VALIDATE')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded text-xs font-medium transition-colors shadow-sm"
                >
                  Validate Selected
                </button>
                <button
                  onClick={() => triggerAction('REJECT')}
                  className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 rounded text-xs font-medium transition-colors shadow-sm"
                >
                  Reject Selected
                </button>
              </>
            )}
            {activeTab === 'OT_PENDING' && (
              <>
                <button
                  onClick={() => triggerAction('APPROVE_OT')}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-xs font-medium transition-colors shadow-sm"
                >
                  Approve OT
                </button>
                <button
                  onClick={() => triggerAction('REJECT_OT')}
                  className="bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-main)] px-3 py-1 rounded text-xs font-medium transition-colors"
                >
                  Reject OT
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {actionError && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3 rounded text-xs font-mono flex items-center justify-between">
          <span>⚠️ {actionError}</span>
          <button onClick={() => setActionError(null)} className="text-rose-500 hover:text-rose-700 font-bold">×</button>
        </div>
      )}

      {/* Main Validation Table Card */}
      <Card className="p-0 overflow-hidden bg-[var(--bg-card)] border-[var(--border-color)]">
        {isLoading ? (
          <div className="p-8 text-center text-[var(--text-muted)] font-mono text-xs">Loading validation queue...</div>
        ) : queue.length === 0 ? (
          <div className="p-12 text-center text-[var(--text-muted)] font-mono text-xs">
            No attendance records in status <span className="text-[var(--text-main)] font-semibold">{activeTab}</span>.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-muted)] font-mono text-[11px] uppercase tracking-wider">
                <th className="p-3 w-10 text-center">
                  <button onClick={toggleSelectAll} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                    {selectedIds.length === queue.length && queue.length > 0 ? <CheckSquare size={16} className="theme-accent-text" /> : <Square size={16} />}
                  </button>
                </th>
                <th className="p-3">Employee</th>
                <th className="p-3">Date</th>
                <th className="p-3">Shift</th>
                <th className="p-3">Check-In</th>
                <th className="p-3">Check-Out</th>
                <th className="p-3">Worked Hrs</th>
                <th className="p-3">OT Hrs</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] text-xs text-[var(--text-main)]">
              {queue.map(row => {
                const isSelected = selectedIds.includes(row.id)
                return (
                  <tr key={row.id} className={`hover:bg-[var(--bg-subtle)] transition-colors ${isSelected ? 'bg-[var(--color-primary)]/10' : ''}`}>
                    <td className="p-3 text-center">
                      <button onClick={() => toggleSelectRow(row.id)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                        {isSelected ? <CheckSquare size={16} className="theme-accent-text" /> : <Square size={16} />}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-[var(--text-main)]">{row.employee_name}</div>
                      <div className="text-[11px] font-mono text-[var(--text-muted)]">{row.employee_code} • {row.department}</div>
                    </td>
                    <td className="p-3 font-mono text-[var(--text-muted)]">{row.date}</td>
                    <td className="p-3 text-[var(--text-muted)]">{row.shift_name}</td>
                    <td className="p-3 font-mono text-[var(--text-main)]">{row.check_in_time}</td>
                    <td className="p-3 font-mono text-[var(--text-main)]">{row.check_out_time}</td>
                    <td className="p-3 font-mono font-medium text-[var(--text-main)]">{row.worked_hours.toFixed(1)} hrs</td>
                    <td className="p-3 font-mono font-bold text-purple-500">
                      {row.ot_hours > 0 ? `+${row.ot_hours.toFixed(1)} hrs` : '--'}
                    </td>
                    <td className="p-3">
                      {row.validation_status === 'TO_VALIDATE' && (
                        <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-semibold">
                          TO VALIDATE
                        </span>
                      )}
                      {row.validation_status === 'OT_PENDING' && (
                        <span className="bg-purple-500/10 text-purple-500 border border-purple-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-semibold">
                          OT PENDING
                        </span>
                      )}
                      {row.validation_status === 'VALIDATED' && (
                        <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-semibold">
                          VALIDATED
                        </span>
                      )}
                      {row.validation_status === 'REJECTED' && (
                        <span className="bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-semibold">
                          REJECTED
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {activeTab === 'TO_VALIDATE' && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => { setSelectedIds([row.id]); triggerAction('VALIDATE') }}
                            className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-500 border border-emerald-500/30 px-2 py-1 rounded text-[11px] font-mono font-medium"
                          >
                            Validate
                          </button>
                          <button
                            onClick={() => { setSelectedIds([row.id]); triggerAction('REJECT') }}
                            className="bg-rose-600/20 hover:bg-rose-600/40 text-rose-500 border border-rose-500/30 px-2 py-1 rounded text-[11px] font-mono font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {activeTab === 'OT_PENDING' && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => { setSelectedIds([row.id]); triggerAction('APPROVE_OT') }}
                            className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-500 border border-purple-500/30 px-2 py-1 rounded text-[11px] font-mono font-medium"
                          >
                            Approve OT
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* Validation Comments Modal */}
      {isCommentModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in font-mono">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl text-[var(--text-main)]">
            <h3 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
              <ShieldCheck size={20} className="theme-accent-text" />
              Confirm Attendance Action ({pendingAction})
            </h3>
            <p className="text-xs text-[var(--text-muted)] font-mono">
              You are performing <span className="text-[var(--text-main)] font-semibold">{pendingAction}</span> on {selectedIds.length} attendance record(s).
            </p>
            <div>
              <label className="block text-xs font-mono text-[var(--text-muted)] mb-1">Audit Comments / Reason:</label>
              <textarea
                value={comments}
                onChange={e => setComments(e.target.value)}
                placeholder="Enter mandatory audit comments..."
                rows={3}
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded p-2 text-xs text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => { setIsCommentModalOpen(false); setPendingAction(null) }}
                className="px-4 py-1.5 rounded text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={batchMutation.isPending}
                className="px-4 py-1.5 rounded text-xs font-mono font-medium theme-accent-bg hover:opacity-90 text-white disabled:opacity-50 shadow-sm"
              >
                {batchMutation.isPending ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
