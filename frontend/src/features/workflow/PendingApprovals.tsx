import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, Search, AlertCircle, CheckSquare, Square } from 'lucide-react'
import { useState } from 'react'
import { Card } from '../../components/ui/Card'

const fetchUniversalApprovals = async () => {
  const res = await fetch('/api/v1/workflow/universal-approvals', {
    headers: { Authorization: `Bearer ${localStorage.getItem('hrms_token') || localStorage.getItem('token')}` }
  })
  if (!res.ok) throw new Error('Failed to fetch approval tasks')
  return res.json()
}

export const PendingApprovals = () => {
  const qc = useQueryClient()
  const [selectedModule, setSelectedModule] = useState('ALL')
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false)
  const [bulkActionType, setBulkActionType] = useState<'APPROVE' | 'REJECT'>('APPROVE')
  const [actionComment, setActionComment] = useState('')

  const { data, isLoading } = useQuery({ 
    queryKey: ['universal-approvals'], 
    queryFn: fetchUniversalApprovals 
  })

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const singleActionMutation = useMutation({
    mutationFn: async ({ id, action, comments }: { id: string; action: string; comments?: string }) => {
      setErrorMessage(null)
      const res = await fetch(`/api/v1/workflow/tasks/${id}/${action.toLowerCase()}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('hrms_token') || localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ comments })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error?.message || data?.message || 'Action failed')
      }
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['universal-approvals'] })
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Self-approval is forbidden by company policy.')
    }
  })

  const bulkActionMutation = useMutation({
    mutationFn: async () => {
      setErrorMessage(null)
      const res = await fetch('/api/v1/workflow/tasks/bulk-action', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('hrms_token') || localStorage.getItem('token')}` 
        },
        body: JSON.stringify({
          task_ids: selectedTaskIds,
          action: bulkActionType,
          comments: actionComment
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error?.message || data?.message || 'Bulk action failed')
      }
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['universal-approvals'] })
      setSelectedTaskIds([])
      setIsCommentModalOpen(false)
      setActionComment('')
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Self-approval is forbidden by company policy.')
    }
  })

  const tasks = data?.data || []

  const filteredTasks = tasks.filter((t: any) => {
    const matchesModule = selectedModule === 'ALL' || t.module === selectedModule
    const matchesSearch = t.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.type.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesModule && matchesSearch
  })

  const toggleSelectAll = () => {
    if (selectedTaskIds.length === filteredTasks.length) {
      setSelectedTaskIds([])
    } else {
      setSelectedTaskIds(filteredTasks.map((t: any) => t.id))
    }
  }

  const toggleSelectTask = (id: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[var(--text-main)] leading-tight tracking-tight">Universal Approval Center</h1>
          <p className="text-xs font-mono text-[var(--text-muted)] mt-1">CENTRALIZED ACTION QUEUE ACROSS ALL HRMS MODULES</p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2.5 py-1 rounded bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 theme-accent-text font-semibold">
            {tasks.length} PENDING ACTIONABLE ITEMS
          </span>
        </div>
      </div>

      {/* Module Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--border-color)] pb-3 font-mono text-xs">
        {[
          { key: 'ALL', label: 'ALL MODULES', count: tasks.length },
          { key: 'LEAVE', label: 'LEAVES', count: tasks.filter((t: any) => t.module === 'LEAVE').length },
          { key: 'ATTENDANCE', label: 'ATTENDANCE & WFH', count: tasks.filter((t: any) => t.module === 'ATTENDANCE').length },
          { key: 'ADVANCE', label: 'SALARY ADVANCES', count: tasks.filter((t: any) => t.module === 'ADVANCE').length },
          { key: 'OFFBOARDING', label: 'EXIT CLEARANCES', count: tasks.filter((t: any) => t.module === 'OFFBOARDING').length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setSelectedModule(tab.key)}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              selectedModule === tab.key 
                ? 'theme-accent-bg text-white font-semibold shadow-xs' 
                : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-color)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <span>{tab.label}</span>
            <span className="text-[10px] opacity-75">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Error / Forbidden Notice */}
      {errorMessage && (
        <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded flex items-center justify-between font-mono text-xs text-rose-500">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-500" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700 font-bold">Dismiss</button>
        </div>
      )}

      {/* Bulk Action Toolbar */}
      {selectedTaskIds.length > 0 && (
        <div className="bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 p-3 rounded flex items-center justify-between animate-fade-in font-mono text-xs">
          <div className="flex items-center gap-2 theme-accent-text font-medium">
            <CheckSquare size={14} className="theme-accent-text" />
            <span>{selectedTaskIds.length} ITEMS SELECTED</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { setBulkActionType('APPROVE'); setIsCommentModalOpen(true) }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded font-semibold transition-colors flex items-center gap-1 shadow-sm"
            >
              <CheckCircle size={12} /> Bulk Approve
            </button>
            <button 
              onClick={() => { setBulkActionType('REJECT'); setIsCommentModalOpen(true) }}
              className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 rounded font-semibold transition-colors flex items-center gap-1 shadow-sm"
            >
              <XCircle size={12} /> Bulk Reject
            </button>
          </div>
        </div>
      )}

      {/* Table Workspace */}
      <Card className="p-0 overflow-hidden bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
        <div className="px-5 py-3 border-b border-[var(--border-color)] bg-[var(--bg-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search size={14} className="text-[var(--text-muted)]" />
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search employee name, ID, or request type..."
              className="bg-transparent border-none focus:outline-none text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] font-mono w-72"
            />
          </div>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">SHOWING {filteredTasks.length} OF {tasks.length} REQUESTS</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-[var(--text-muted)] font-mono text-xs">Loading operational queue...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <CheckCircle className="w-10 h-10 text-emerald-500 mb-3" />
            <h3 className="text-sm font-semibold text-[var(--text-main)]">Inbox Zero</h3>
            <p className="text-[var(--text-muted)] text-xs font-mono mt-1">No pending requests match your filter criteria.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-subtle)] font-mono text-xs text-[var(--text-muted)]">
                <th className="px-4 py-2.5 w-10 text-center">
                  <button onClick={toggleSelectAll} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                    {selectedTaskIds.length === filteredTasks.length ? <CheckSquare size={14}/> : <Square size={14}/>}
                  </button>
                </th>
                <th className="px-4 py-2.5 uppercase">Employee</th>
                <th className="px-4 py-2.5 uppercase">Module & Type</th>
                <th className="px-4 py-2.5 uppercase">Target Period / Details</th>
                <th className="px-4 py-2.5 uppercase">Priority</th>
                <th className="px-4 py-2.5 uppercase text-right">Action Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] text-xs text-[var(--text-main)]">
              {filteredTasks.map((t: any) => {
                const isSelected = selectedTaskIds.includes(t.id)
                return (
                  <tr key={t.id} className={`hover:bg-[var(--bg-subtle)] transition-colors ${isSelected ? 'bg-[var(--color-primary)]/5' : ''}`}>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleSelectTask(t.id)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                        {isSelected ? <CheckSquare size={14} className="theme-accent-text"/> : <Square size={14}/>}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[var(--text-main)]">{t.employee_name}</div>
                      <div className="text-[11px] font-mono text-[var(--text-muted)]">{t.employee_id} • {t.department}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-[var(--text-main)] font-medium">{t.type}</div>
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[10px] font-mono uppercase bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-color)] rounded">
                        {t.module}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[280px]">
                      <div className="font-mono text-[var(--text-main)] font-medium">{t.requested_date}</div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate" title={t.reason}>{t.reason}</div>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        t.priority === 'URGENT' 
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                          : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-color)]'
                      }`}>
                        {t.priority === 'URGENT' && <AlertCircle size={10} />}
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {t.is_self_request ? (
                        <span className="inline-block px-2.5 py-1 rounded text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                          Self-Request (Action Blocked)
                        </span>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => singleActionMutation.mutate({ id: t.id, action: 'APPROVE' })}
                            className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded text-xs font-mono hover:bg-emerald-500/20 transition-colors flex items-center gap-1 font-semibold"
                          >
                            <CheckCircle size={12} /> Approve
                          </button>
                          <button 
                            onClick={() => singleActionMutation.mutate({ id: t.id, action: 'REJECT' })}
                            className="px-2.5 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/30 rounded text-xs font-mono hover:bg-rose-500/20 transition-colors flex items-center gap-1 font-semibold"
                          >
                            <XCircle size={12} /> Reject
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

      {/* Bulk Action Comment Modal */}
      {isCommentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
          <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in text-[var(--text-main)]">
            <div className="px-5 py-3 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-subtle)]">
              <h3 className="font-semibold text-[var(--text-main)] text-sm font-mono">
                EXECUTE BULK {bulkActionType} ({selectedTaskIds.length} ITEMS)
              </h3>
              <button onClick={() => setIsCommentModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] font-bold text-base">
                ×
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[var(--text-muted)] mb-1">Approval / Rejection Remark (Optional)</label>
                <textarea 
                  value={actionComment}
                  onChange={e => setActionComment(e.target.value)}
                  placeholder="Provide audit remark for bulk action..."
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded p-2 text-[var(--text-main)] focus:border-[var(--color-primary)] focus:outline-none min-h-[90px] resize-none placeholder-[var(--text-muted)]"
                />
              </div>
              <div className="pt-2 flex gap-2">
                <button 
                  onClick={() => setIsCommentModalOpen(false)}
                  className="flex-1 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)] border border-[var(--border-color)] py-2 rounded transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => bulkActionMutation.mutate()}
                  disabled={bulkActionMutation.isPending}
                  className={`flex-1 text-white font-semibold py-2 rounded transition-colors shadow-sm ${
                    bulkActionType === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {bulkActionMutation.isPending ? 'Processing...' : `Confirm ${bulkActionType}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
