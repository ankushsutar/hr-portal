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

  const singleActionMutation = useMutation({
    mutationFn: async ({ id, action, comments }: { id: string; action: string; comments?: string }) => {
      const res = await fetch(`/api/v1/workflow/tasks/${id}/${action.toLowerCase()}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('hrms_token') || localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ comments })
      })
      if (!res.ok) throw new Error('Action failed')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['universal-approvals'] })
  })

  const bulkActionMutation = useMutation({
    mutationFn: async () => {
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
      if (!res.ok) throw new Error('Bulk action failed')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['universal-approvals'] })
      setSelectedTaskIds([])
      setIsCommentModalOpen(false)
      setActionComment('')
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-slate-100 leading-tight tracking-tight">Universal Approval Center</h1>
          <p className="text-xs font-mono text-slate-400 mt-1">CENTRALIZED ACTION QUEUE ACROSS ALL HRMS MODULES</p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold">
            {tasks.length} PENDING ACTIONABLE ITEMS
          </span>
        </div>
      </div>

      {/* Module Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3 font-mono text-xs">
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
                ? 'bg-blue-600 text-white font-semibold' 
                : 'bg-[#111827] text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            <span className="text-[10px] opacity-75">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Bulk Action Toolbar */}
      {selectedTaskIds.length > 0 && (
        <div className="bg-blue-950/40 border border-blue-500/30 p-3 rounded flex items-center justify-between animate-fade-in font-mono text-xs">
          <div className="flex items-center gap-2 text-blue-300 font-medium">
            <CheckSquare size={14} className="text-blue-400" />
            <span>{selectedTaskIds.length} ITEMS SELECTED</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { setBulkActionType('APPROVE'); setIsCommentModalOpen(true) }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded font-semibold transition-colors flex items-center gap-1"
            >
              <CheckCircle size={12} /> Bulk Approve
            </button>
            <button 
              onClick={() => { setBulkActionType('REJECT'); setIsCommentModalOpen(true) }}
              className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 rounded font-semibold transition-colors flex items-center gap-1"
            >
              <XCircle size={12} /> Bulk Reject
            </button>
          </div>
        </div>
      )}

      {/* Table Workspace */}
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search size={14} className="text-slate-500" />
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search employee name, ID, or request type..."
              className="bg-transparent border-none focus:outline-none text-xs text-slate-200 placeholder-slate-500 font-mono w-72"
            />
          </div>
          <span className="text-[11px] font-mono text-slate-500">SHOWING {filteredTasks.length} OF {tasks.length} REQUESTS</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-500 font-mono text-xs">Loading operational queue...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <CheckCircle className="w-10 h-10 text-emerald-400 mb-3" />
            <h3 className="text-sm font-semibold text-slate-200">Inbox Zero</h3>
            <p className="text-slate-500 text-xs font-mono mt-1">No pending requests match your filter criteria.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40 font-mono text-xs text-slate-400">
                <th className="px-4 py-2.5 w-10 text-center">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-200">
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
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredTasks.map((t: any) => {
                const isSelected = selectedTaskIds.includes(t.id)
                return (
                  <tr key={t.id} className={`hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-blue-500/5' : ''}`}>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleSelectTask(t.id)} className="text-slate-400 hover:text-slate-200">
                        {isSelected ? <CheckSquare size={14} className="text-blue-400"/> : <Square size={14}/>}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-200">{t.employee_name}</div>
                      <div className="text-[11px] font-mono text-slate-500">{t.employee_id} • {t.department}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-slate-200 font-medium">{t.type}</div>
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[10px] font-mono uppercase bg-slate-800 text-slate-400 border border-slate-700 rounded">
                        {t.module}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[280px]">
                      <div className="font-mono text-slate-300 font-medium">{t.requested_date}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate" title={t.reason}>{t.reason}</div>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        t.priority === 'URGENT' 
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {t.priority === 'URGENT' && <AlertCircle size={10} />}
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => singleActionMutation.mutate({ id: t.id, action: 'APPROVE' })}
                          className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-xs font-mono hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
                        >
                          <CheckCircle size={12} /> Approve
                        </button>
                        <button 
                          onClick={() => singleActionMutation.mutate({ id: t.id, action: 'REJECT' })}
                          className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded text-xs font-mono hover:bg-rose-500/20 transition-colors flex items-center gap-1"
                        >
                          <XCircle size={12} /> Reject
                        </button>
                      </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#111827] rounded-lg border border-slate-800 shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <h3 className="font-semibold text-slate-100 text-sm font-mono">
                EXECUTE BULK {bulkActionType} ({selectedTaskIds.length} ITEMS)
              </h3>
              <button onClick={() => setIsCommentModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                ×
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Approval / Rejection Remark (Optional)</label>
                <textarea 
                  value={actionComment}
                  onChange={e => setActionComment(e.target.value)}
                  placeholder="Provide audit remark for bulk action..."
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded p-2 text-slate-200 focus:border-blue-500 focus:outline-none min-h-[90px] resize-none"
                />
              </div>
              <div className="pt-2 flex gap-2">
                <button 
                  onClick={() => setIsCommentModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => bulkActionMutation.mutate()}
                  disabled={bulkActionMutation.isPending}
                  className={`flex-1 text-white font-semibold py-2 rounded transition-colors ${
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
