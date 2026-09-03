import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { Card } from '../../components/ui/Card'
import { DollarSign, CheckCircle2, AlertTriangle, Plus, FileText, UserCheck } from 'lucide-react'

interface EncashmentItem {
  id: string
  employee_id: string
  employee_code?: string
  employee_name?: string
  leave_type_id: string
  leave_type_name?: string
  days_to_encash: number
  per_day_rate: number
  total_amount: number
  status: string
  reason: string
  created_at?: string
}

interface LeavePolicy {
  leave_type_id: string
  leave_type_name: string
  is_encashable: boolean
}

export const LeaveEncashmentConsole = () => {
  const { hasRole } = useAuth()
  const isManagerOrAdmin = hasRole(['MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'])
  const qc = useQueryClient()
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)

  // Form State
  const [selectedLeaveType, setSelectedLeaveType] = useState('')
  const [encashDays, setEncashDays] = useState('5')
  const [encashReason, setEncashReason] = useState('')

  // Estimated daily rate based on 60,000 INR average monthly salary
  const estPerDayRate = 2000.0
  const estTotalPayout = (parseFloat(encashDays) || 0) * estPerDayRate

  // Fetch Policies to get encashable types
  const { data: policiesRes } = useQuery({
    queryKey: ['leave-policies'],
    queryFn: async () => {
      const res = await fetch('/api/v1/leave/policies', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to load policies')
      return res.json()
    }
  })

  // Fetch Encashments Queue
  const { data: encashRes, isLoading } = useQuery({
    queryKey: ['leave-encashments'],
    queryFn: async () => {
      const res = await fetch('/api/v1/leave/encashment', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to load encashments')
      return res.json()
    }
  })

  // Submit Encashment Mutation
  const submitMut = useMutation({
    mutationFn: async (payload: { leave_type_id: string; days_to_encash: number; reason: string }) => {
      const res = await fetch('/api/v1/leave/encashment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error || 'Failed to submit request')
      return data
    },
    onSuccess: (data) => {
      setSuccessMsg(data.message)
      setIsRequestModalOpen(false)
      setSelectedLeaveType('')
      setEncashReason('')
      qc.invalidateQueries({ queryKey: ['leave-encashments'] })
    },
    onError: (err: any) => {
      setErrorMsg(err.message)
    }
  })

  // Review Encashment Mutation
  const reviewMut = useMutation({
    mutationFn: async ({ encashment_id, action }: { encashment_id: string; action: string }) => {
      const res = await fetch('/api/v1/leave/encashment/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ encashment_id, action })
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error || 'Failed to review request')
      return data
    },
    onSuccess: (data) => {
      setSuccessMsg(data.message)
      qc.invalidateQueries({ queryKey: ['leave-encashments'] })
    },
    onError: (err: any) => {
      setErrorMsg(err.message)
    }
  })

  const encashablePolicies: LeavePolicy[] = (policiesRes?.data || []).filter((p: any) => p.is_encashable)
  const encashments: EncashmentItem[] = encashRes?.data || []

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded text-xs font-mono flex items-center justify-between">
          <span className="flex items-center gap-1.5"><CheckCircle2 size={14} /> {successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="font-bold">×</button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded text-xs font-mono flex items-center justify-between">
          <span className="flex items-center gap-1.5"><AlertTriangle size={14} /> {errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="font-bold">×</button>
        </div>
      )}

      {/* Header Banner */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <DollarSign size={18} className="text-emerald-400" />
              Leave Encashment & Multi-Level Approval Engine
            </h3>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Monetize accumulated encashable leave balances and manage multi-stage managerial and HR payroll approvals.
            </p>
          </div>
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus size={14} /> Request Encashment
          </button>
        </div>
      </Card>

      {/* Multi-Level Workflow Visualizer Card */}
      {isManagerOrAdmin && (
        <Card className="p-5 space-y-4">
          <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <UserCheck size={16} className="text-blue-400" />
            Standard 2-Level Leave Approval Hierarchy
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="bg-[#0B0F19] border border-slate-800 p-3.5 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 text-blue-400 border border-blue-500/30 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div>
                  <div className="text-slate-200 font-semibold">Level 1: Reporting Manager</div>
                  <div className="text-[11px] text-slate-500">Reviews workload impact & team coverage</div>
                </div>
              </div>
              <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded border border-blue-500/20">
                OPERATIONAL
              </span>
            </div>

            <div className="bg-[#0B0F19] border border-slate-800 p-3.5 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500/20 text-purple-400 border border-purple-500/30 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <div>
                  <div className="text-slate-200 font-semibold">Level 2: HR & Payroll Admin</div>
                  <div className="text-[11px] text-slate-500">Verifies balance entitlement & processes payout</div>
                </div>
              </div>
              <span className="bg-purple-500/10 text-purple-400 text-[10px] px-2 py-0.5 rounded border border-purple-500/20">
                FINANCIAL AUDIT
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Encashment Requests Queue */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <FileText size={16} className="text-emerald-400" />
            Leave Encashment Requests Queue ({encashments.length})
          </h4>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-slate-500 font-mono text-xs">Loading encashment requests...</div>
        ) : encashments.length === 0 ? (
          <div className="py-8 text-center text-slate-500 font-mono text-xs">No leave encashment requests submitted yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Employee</th>
                  <th className="pb-3 font-semibold">Leave Type</th>
                  <th className="pb-3 font-semibold">Days</th>
                  <th className="pb-3 font-semibold">Daily Rate</th>
                  <th className="pb-3 font-semibold">Total Payout</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {encashments.map(item => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-semibold text-slate-200">
                      {item.employee_name || 'Employee'} <span className="text-slate-500 text-[11px]">({item.employee_code || 'EMP'})</span>
                    </td>
                    <td className="py-3">{item.leave_type_name}</td>
                    <td className="py-3 font-bold text-slate-200">{item.days_to_encash} Days</td>
                    <td className="py-3 text-slate-400">₹{item.per_day_rate?.toLocaleString()} / day</td>
                    <td className="py-3 text-emerald-400 font-bold">₹{item.total_amount?.toLocaleString()}</td>
                    <td className="py-3">
                      {item.status === 'APPROVED' ? (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                          APPROVED
                        </span>
                      ) : item.status === 'REJECTED' ? (
                        <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                          REJECTED
                        </span>
                      ) : (
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                          PENDING HR AUDIT
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {item.status === 'PENDING' && isManagerOrAdmin && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => reviewMut.mutate({ encashment_id: item.id, action: 'APPROVE' })}
                            className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded text-[11px] font-medium transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => reviewMut.mutate({ encashment_id: item.id, action: 'REJECT' })}
                            className="bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded text-[11px] font-medium transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Request Encashment Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-lg w-full max-w-md p-6 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <DollarSign size={16} className="text-emerald-400" />
                Submit Leave Encashment Request
              </h3>
              <button onClick={() => setIsRequestModalOpen(false)} className="text-slate-400 hover:text-white font-bold">×</button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Encashable Leave Category</label>
                <select
                  value={selectedLeaveType}
                  onChange={e => setSelectedLeaveType(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none"
                >
                  <option value="">-- Select Category --</option>
                  {encashablePolicies.map(p => (
                    <option key={p.leave_type_id} value={p.leave_type_id}>
                      {p.leave_type_name} (Encashable)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Number of Days to Encash</label>
                <input
                  type="number"
                  value={encashDays}
                  onChange={e => setEncashDays(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none"
                />
              </div>

              {/* Real-time Calculation Preview */}
              <div className="bg-[#0B0F19] p-3.5 rounded border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Estimated Daily Rate:</span>
                  <span className="text-slate-200 font-semibold">₹{estPerDayRate.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1.5 font-bold">
                  <span>Estimated Total Payout:</span>
                  <span className="text-emerald-400 text-sm">₹{estTotalPayout.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Justification / Remarks</label>
                <textarea
                  rows={3}
                  value={encashReason}
                  onChange={e => setEncashReason(e.target.value)}
                  placeholder="e.g. Year-end leave monetization request"
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded p-2 text-slate-200 placeholder-slate-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="px-3 py-1.5 rounded text-xs font-mono text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => submitMut.mutate({
                  leave_type_id: selectedLeaveType,
                  days_to_encash: parseFloat(encashDays) || 0,
                  reason: encashReason
                })}
                disabled={!selectedLeaveType || submitMut.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded text-xs font-mono font-medium transition-colors disabled:opacity-50"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
