import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '../../components/ui/Card'
import { Calendar, Play, CheckCircle2, AlertTriangle, Settings, ToggleLeft, ToggleRight, Layers, Clock } from 'lucide-react'

interface LeavePolicy {
  id: string
  leave_type_id: string
  leave_type_name: string
  leave_type_code: string
  policy_name: string
  accrual_frequency: string
  accrual_rate: number
  max_carry_forward_days: number
  sandwich_rule_enabled: boolean
  is_encashable: boolean
}

interface AccrualLog {
  id: string
  employee_id: string
  employee_code: string
  employee_name: string
  leave_type_name: string
  accrual_date: string
  days_added: number
  reason: string
}

export const LeavePolicyManager = () => {
  const qc = useQueryClient()
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [editingPolicy, setEditingPolicy] = useState<LeavePolicy | null>(null)

  // Fetch Policies
  const { data: policiesRes, isLoading: policiesLoading } = useQuery({
    queryKey: ['leave-policies'],
    queryFn: async () => {
      const res = await fetch('/api/v1/leave/policies', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to load leave policies')
      return res.json()
    }
  })

  // Fetch Accrual Logs
  const { data: logsRes } = useQuery({
    queryKey: ['leave-accrual-logs'],
    queryFn: async () => {
      const res = await fetch('/api/v1/leave/accrual-logs', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to load accrual logs')
      return res.json()
    }
  })

  // Save Policy Mutation
  const savePolicyMut = useMutation({
    mutationFn: async (policy: Partial<LeavePolicy>) => {
      const res = await fetch('/api/v1/leave/policies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(policy)
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error || 'Failed to save policy')
      return data
    },
    onSuccess: () => {
      setEditingPolicy(null)
      setSuccessMsg('Leave policy updated successfully.')
      qc.invalidateQueries({ queryKey: ['leave-policies'] })
    },
    onError: (err: any) => {
      setErrorMsg(err.message)
    }
  })

  // Batch Accrual Mutation
  const batchAccrualMut = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/leave/accrue-batch', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error || 'Batch accrual failed')
      return data
    },
    onSuccess: (data) => {
      setSuccessMsg(data.message)
      qc.invalidateQueries({ queryKey: ['leave-accrual-logs'] })
      qc.invalidateQueries({ queryKey: ['leave-policies'] })
    },
    onError: (err: any) => {
      setErrorMsg(err.message)
    }
  })

  const policies: LeavePolicy[] = policiesRes?.data || []
  const accrualLogs: AccrualLog[] = logsRes?.data || []

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

      {/* Action Header & Batch Accrual Trigger */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Calendar size={18} className="text-emerald-400" />
              Advanced Leave Rules & Automated Accrual Engine
            </h3>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Configure accrual cycles, Sandwich Rule enforcement, carry-forward caps, and trigger batch monthly leave credit runs.
            </p>
          </div>
          <button
            onClick={() => batchAccrualMut.mutate()}
            disabled={batchAccrualMut.isPending}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded text-xs font-mono font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Play size={14} className={batchAccrualMut.isPending ? 'animate-spin' : ''} />
            Execute Monthly Accrual Run
          </button>
        </div>
      </Card>

      {/* Policies Table */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Layers size={16} className="text-blue-400" />
            Configured Leave Policies ({policies.length})
          </h4>
        </div>

        {policiesLoading ? (
          <div className="py-8 text-center text-slate-500 font-mono text-xs">Loading leave policies...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Leave Type</th>
                  <th className="pb-3 font-semibold">Accrual Cycle</th>
                  <th className="pb-3 font-semibold">Credit Rate</th>
                  <th className="pb-3 font-semibold">Carry Forward</th>
                  <th className="pb-3 font-semibold">Sandwich Rule</th>
                  <th className="pb-3 font-semibold">Encashable</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {policies.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-semibold text-slate-200">
                      {p.leave_type_name} <span className="text-slate-500 text-[11px]">({p.leave_type_code})</span>
                    </td>
                    <td className="py-3">
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px]">
                        {p.accrual_frequency}
                      </span>
                    </td>
                    <td className="py-3 text-emerald-400 font-bold">+{p.accrual_rate} Days / cycle</td>
                    <td className="py-3">{p.max_carry_forward_days} Days Max</td>
                    <td className="py-3">
                      {p.sandwich_rule_enabled ? (
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px]">
                          ENABLED (Weekend Deduct)
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Disabled</span>
                      )}
                    </td>
                    <td className="py-3">
                      {p.is_encashable ? (
                        <span className="text-emerald-400">Yes</span>
                      ) : (
                        <span className="text-slate-500">No</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setEditingPolicy(p)}
                        className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded text-[11px] font-medium transition-colors"
                      >
                        Edit Policy
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Edit Policy Modal */}
      {editingPolicy && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-lg w-full max-w-lg p-6 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Settings size={16} className="text-blue-400" />
                Configure Policy for {editingPolicy.leave_type_name}
              </h3>
              <button onClick={() => setEditingPolicy(null)} className="text-slate-400 hover:text-white font-bold">×</button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Accrual Frequency</label>
                <select
                  value={editingPolicy.accrual_frequency}
                  onChange={e => setEditingPolicy({ ...editingPolicy, accrual_frequency: e.target.value })}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none"
                >
                  <option value="MONTHLY">MONTHLY (Every 1st of month)</option>
                  <option value="QUARTERLY">QUARTERLY (Every 3 months)</option>
                  <option value="ANNUAL">ANNUAL (Lump sum start of year)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Accrual Rate (Days)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={editingPolicy.accrual_rate}
                    onChange={e => setEditingPolicy({ ...editingPolicy, accrual_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0B0F19] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Max Carry Forward (Days)</label>
                  <input
                    type="number"
                    value={editingPolicy.max_carry_forward_days}
                    onChange={e => setEditingPolicy({ ...editingPolicy, max_carry_forward_days: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#0B0F19] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Sandwich Rule Toggle */}
              <div className="bg-[#0B0F19] border border-slate-800 p-3.5 rounded flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Sandwich Rule Enforcement</div>
                  <div className="text-[11px] text-slate-500">Count weekend days if leave spans Fri & Mon</div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingPolicy({ ...editingPolicy, sandwich_rule_enabled: !editingPolicy.sandwich_rule_enabled })}
                >
                  {editingPolicy.sandwich_rule_enabled ? (
                    <ToggleRight size={32} className="text-amber-500" />
                  ) : (
                    <ToggleLeft size={32} className="text-slate-600" />
                  )}
                </button>
              </div>

              {/* Encashable Toggle */}
              <div className="bg-[#0B0F19] border border-slate-800 p-3.5 rounded flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Encashable at Year End</div>
                  <div className="text-[11px] text-slate-500">Allow monetary conversion of unused days</div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingPolicy({ ...editingPolicy, is_encashable: !editingPolicy.is_encashable })}
                >
                  {editingPolicy.is_encashable ? (
                    <ToggleRight size={32} className="text-emerald-500" />
                  ) : (
                    <ToggleLeft size={32} className="text-slate-600" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setEditingPolicy(null)}
                className="px-3 py-1.5 rounded text-xs font-mono text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => savePolicyMut.mutate(editingPolicy)}
                disabled={savePolicyMut.isPending}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded text-xs font-mono font-medium transition-colors disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accrual Logs History */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Clock size={16} className="text-purple-400" />
            Recent Batch Accrual Execution History ({accrualLogs.length})
          </h4>
        </div>

        {accrualLogs.length === 0 ? (
          <div className="py-6 text-center text-slate-500 font-mono text-xs">No batch accruals executed yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Employee</th>
                  <th className="pb-3 font-semibold">Leave Type</th>
                  <th className="pb-3 font-semibold">Accrual Date</th>
                  <th className="pb-3 font-semibold">Days Credited</th>
                  <th className="pb-3 font-semibold">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {accrualLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-semibold text-slate-200">
                      {log.employee_name} <span className="text-slate-500 text-[11px]">({log.employee_code})</span>
                    </td>
                    <td className="py-3">{log.leave_type_name}</td>
                    <td className="py-3 text-slate-400">{log.accrual_date}</td>
                    <td className="py-3 text-emerald-400 font-bold">+{log.days_added} Days</td>
                    <td className="py-3 text-slate-400 text-[11px]">{log.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
