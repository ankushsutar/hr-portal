import React, { useState } from 'react'
import { Plus, Check, X, Search, Loader2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../lib/api'

function getInitials(name: string) {
  if (!name) return '?'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

function getAvatarColor(name: string) {
  const colors = [
    'bg-[var(--color-primary)]/20 theme-accent-text border border-[var(--color-primary)]/30',
    'bg-indigo-500/20 text-indigo-500 border border-indigo-500/30',
    'bg-violet-500/20 text-violet-500 border border-violet-500/30',
    'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30',
    'bg-amber-500/20 text-amber-500 border border-amber-500/30',
    'bg-rose-500/20 text-rose-500 border border-rose-500/30',
    'bg-cyan-500/20 text-cyan-500 border border-cyan-500/30',
  ]
  const idx = name ? name.charCodeAt(0) % colors.length : 0
  return colors[idx]
}

interface RequestItem {
  id: string
  employee_code: string
  employee_name: string
  date: string
  check_in: string
  check_out: string
  shift: string
  at_work: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reason: string
}

export const AttendanceRequestsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'REQUESTED' | 'ALL'>('REQUESTED')
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // Form State
  const [reqEmp, setReqEmp] = useState('')
  const [reqDate, setReqDate] = useState(new Date().toISOString().split('T')[0])
  const [reqIn, setReqIn] = useState('09:00')
  const [reqOut, setReqOut] = useState('18:00')
  const [reqShift, setReqShift] = useState('Regular Shift')
  const [reqReason, setReqReason] = useState('')

  const endpoint = activeTab === 'REQUESTED' 
    ? '/attendance/requests/pending' 
    : '/attendance/requests/me'

  const { data: response, isLoading } = useQuery({
    queryKey: ['attendance-requests', activeTab],
    queryFn: () => apiFetch(endpoint)
  })

  const requests: RequestItem[] = (response as any)?.data || []

  const submitMutation = useMutation({
    mutationFn: (payload: any) => apiFetch('/attendance/requests', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-requests'] })
      setIsModalOpen(false)
      setReqReason('')
      setToastMsg('Regularization Request Submitted!')
      setTimeout(() => setToastMsg(null), 3000)
    }
  })

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string, action: 'approve' | 'reject' }) => 
      apiFetch(`/attendance/requests/${id}/${action}`, { method: 'POST' }),
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['attendance-requests'] })
      setToastMsg(`Request ${action === 'approve' ? 'Approved' : 'Rejected'} Successfully!`)
      setTimeout(() => setToastMsg(null), 3000)
    }
  })

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitMutation.mutate({
      employee_id: reqEmp, // optional, for managers to submit on behalf of
      date: reqDate,
      check_in: reqIn,
      check_out: reqOut,
      reason: reqReason || 'Attendance Regularization Request'
    })
  }

  const filteredRequests = requests.filter((r) => {
    if (activeTab === 'REQUESTED' && r.status !== 'PENDING') return false
    return (
      r.employee_name.toLowerCase().includes(search.toLowerCase()) ||
      r.employee_code.toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-emerald-500/20 border border-emerald-500/40 text-emerald-500 px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2 z-50 animate-bounce">
          <Check className="w-4 h-4" />
          <span className="text-xs font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('REQUESTED')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'REQUESTED'
                ? 'bg-[var(--color-primary)]/20 theme-accent-text border border-[var(--color-primary)]/30 font-bold'
                : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)]'
            }`}
          >
            Requested Attendances {activeTab === 'REQUESTED' && !isLoading ? `(${filteredRequests.length})` : ''}
          </button>
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'ALL'
                ? 'bg-[var(--color-primary)]/20 theme-accent-text border border-[var(--color-primary)]/30 font-bold'
                : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)]'
            }`}
          >
            All Attendances {activeTab === 'ALL' && !isLoading ? `(${requests.length})` : ''}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee..."
              className="bg-[var(--bg-subtle)] border border-[var(--border-color)] text-xs text-[var(--text-main)] pl-8 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-[var(--color-primary)] w-48"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 theme-accent-bg hover:opacity-90 text-white text-xs font-medium px-4 py-2 rounded-xl shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Request</span>
          </button>
        </div>
      </div>

      {/* Requests Data Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm min-h-[300px] relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--bg-card)]/60 backdrop-blur-xs">
            <Loader2 className="w-6 h-6 animate-spin theme-accent-text" />
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[var(--text-main)]">
            <thead className="bg-[var(--bg-subtle)] text-[var(--text-muted)] uppercase font-mono text-[11px] border-b border-[var(--border-color)]">
              <tr>
                <th className="p-4">Employee</th>
                <th className="p-4">Date</th>
                <th className="p-4">Check-In</th>
                <th className="p-4">Check-Out</th>
                <th className="p-4">Shift</th>
                <th className="p-4">At Work</th>
                <th className="p-4">Reason</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredRequests.map((r) => (
                <tr key={r.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getAvatarColor(r.employee_name)}`}>
                        {getInitials(r.employee_name)}
                      </div>
                      <div>
                        <div className="font-semibold text-[var(--text-main)] text-xs font-sans">{r.employee_name}</div>
                        <div className="text-[11px] text-[var(--text-muted)] font-mono">{r.employee_code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-[var(--text-muted)]">{r.date}</td>
                  <td className="p-4 font-mono text-emerald-500 font-semibold">{r.check_in}</td>
                  <td className="p-4 font-mono text-amber-500 font-semibold">{r.check_out}</td>
                  <td className="p-4 text-[var(--text-main)]">{r.shift}</td>
                  <td className="p-4 font-mono theme-accent-text">{r.at_work} hrs</td>
                  <td className="p-4 text-[var(--text-muted)] max-w-xs truncate">{r.reason}</td>
                  <td className="p-4">
                    {r.status === 'PENDING' && (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-500">
                        Requested
                      </span>
                    )}
                    {r.status === 'APPROVED' && (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                        Approved
                      </span>
                    )}
                    {r.status === 'REJECTED' && (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-500">
                        Rejected
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {r.status === 'PENDING' && activeTab === 'REQUESTED' && (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => actionMutation.mutate({ id: r.id, action: 'approve' })}
                          disabled={actionMutation.isPending}
                          className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-500 border border-emerald-500/30 transition-colors disabled:opacity-50"
                          title="Approve Request"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => actionMutation.mutate({ id: r.id, action: 'reject' })}
                          disabled={actionMutation.isPending}
                          className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-500 border border-rose-500/30 transition-colors disabled:opacity-50"
                          title="Reject Request"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && filteredRequests.length === 0 && (
                 <tr>
                   <td colSpan={9} className="p-8 text-center text-[var(--text-muted)] font-medium">
                     No requests found
                   </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Popup for Create Request */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-fade-in text-[var(--text-main)]">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h3 className="text-base font-semibold text-[var(--text-main)]">Create Attendance Request</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Employee ID (Optional)</label>
                <input
                  type="text"
                  value={reqEmp}
                  onChange={(e) => setReqEmp(e.target.value)}
                  placeholder="e.g. PEP00 (Leave blank for self)"
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={reqDate}
                    onChange={(e) => setReqDate(e.target.value)}
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Shift</label>
                  <select
                    value={reqShift}
                    onChange={(e) => setReqShift(e.target.value)}
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--color-primary)]"
                  >
                    <option>Regular Shift</option>
                    <option>Morning Shift</option>
                    <option>Night Shift</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Check-In Time</label>
                  <input
                    type="time"
                    required
                    value={reqIn}
                    onChange={(e) => setReqIn(e.target.value)}
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Check-Out Time</label>
                  <input
                    type="time"
                    required
                    value={reqOut}
                    onChange={(e) => setReqOut(e.target.value)}
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Reason / Justification</label>
                <textarea
                  required
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  rows={3}
                  placeholder="Enter reason for regularization..."
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-medium theme-accent-bg hover:opacity-90 text-white shadow-md disabled:opacity-50"
                >
                  {submitMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
