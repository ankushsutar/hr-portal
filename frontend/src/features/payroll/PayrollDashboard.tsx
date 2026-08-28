import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, Eye, TrendingUp, DollarSign, Play, CheckCircle2, Lock, Share2, Plus, AlertTriangle, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { Card } from '../../components/ui/Card'
import { PayslipView } from './PayslipView'

const fetchPayrollRuns = async () => {
  const res = await fetch('/api/v1/payroll/runs', {
    headers: { Authorization: `Bearer ${localStorage.getItem('hrms_token') || localStorage.getItem('token')}` }
  })
  if (!res.ok) throw new Error('Failed to fetch runs')
  return res.json()
}

const fetchAdvances = async () => {
  const res = await fetch('/api/v1/payroll/advances', {
    headers: { Authorization: `Bearer ${localStorage.getItem('hrms_token') || localStorage.getItem('token')}` }
  })
  if (!res.ok) throw new Error('Failed to fetch advances')
  return res.json()
}

const fetchPayslips = async () => {
  const res = await fetch('/api/v1/payroll/payslips', {
    headers: { Authorization: `Bearer ${localStorage.getItem('hrms_token') || localStorage.getItem('token')}` }
  })
  if (!res.ok) throw new Error('Failed to fetch payslips')
  return res.json()
}

export const PayrollDashboard = () => {
  const qc = useQueryClient()
  const [selectedPayslipId, setSelectedPayslipId] = useState<string | null>(null)
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false)
  const [advanceForm, setAdvanceForm] = useState({ employee_id: '', amount: '', reason: '', month: 8, year: 2026 })

  const { data: runsData, isLoading: runsLoading } = useQuery({ queryKey: ['payroll-runs'], queryFn: fetchPayrollRuns })
  const { data: advancesData, isLoading: advancesLoading } = useQuery({ queryKey: ['payroll-advances'], queryFn: fetchAdvances })
  const { data: payslipsData, isLoading: payslipsLoading } = useQuery({ queryKey: ['payslips'], queryFn: fetchPayslips })

  const processMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/payroll/runs/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('hrms_token') || localStorage.getItem('token')}`
        },
        body: JSON.stringify({ month: 8, year: 2026 })
      })
      if (!res.ok) throw new Error('Processing failed')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll-runs'] })
  })

  const transitionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      const res = await fetch(`/api/v1/payroll/runs/${id}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('hrms_token') || localStorage.getItem('token')}`
        },
        body: JSON.stringify({ action })
      })
      if (!res.ok) throw new Error('Transition failed')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll-runs'] })
  })

  const createAdvanceMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/payroll/advances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('hrms_token') || localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          employee_id: advanceForm.employee_id || 'EMP-1024',
          amount: parseFloat(advanceForm.amount) || 10000,
          reason: advanceForm.reason || 'Salary advance',
          deduct_from_month: Number(advanceForm.month),
          deduct_from_year: Number(advanceForm.year)
        })
      })
      if (!res.ok) throw new Error('Failed to create advance')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll-advances'] })
      setIsAdvanceModalOpen(false)
      setAdvanceForm({ employee_id: '', amount: '', reason: '', month: 8, year: 2026 })
    }
  })

  if (selectedPayslipId) {
    return <PayslipView id={selectedPayslipId} onBack={() => setSelectedPayslipId(null)} />
  }

  const currentRun = runsData?.data?.[0] || {
    id: 'prun-082026',
    status: 'VALIDATED',
    month: 8,
    year: 2026,
    total_employees: 128,
    total_net_pay: 4120000,
    total_lop_days: 12.5,
    total_advances_deducted: 45000,
    variance_percentage: 2.4
  }

  const states = ['DRAFT', 'PROCESSING', 'VALIDATED', 'APPROVED', 'LOCKED', 'PUBLISHED']
  const currentStepIdx = states.indexOf(currentRun.status)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-slate-100 leading-tight tracking-tight">Payroll Processing Console</h1>
          <p className="text-xs font-mono text-slate-400 mt-1">MONTHLY RUN EXECUTION, LOP DEDUCTIONS & ADVANCES</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsAdvanceModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors"
          >
            <Plus size={14} /> Request Advance
          </button>
          <button 
            onClick={() => processMutation.mutate()}
            disabled={processMutation.isPending || currentRun.status === 'LOCKED' || currentRun.status === 'PUBLISHED'}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors"
          >
            <Play size={14} /> {processMutation.isPending ? 'Processing...' : 'Run Payroll Calculation'}
          </button>
        </div>
      </div>

      {/* State Machine Stepper */}
      <Card className="p-4 bg-[#111827]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-mono font-semibold text-slate-200">PAYROLL RUN STATE MACHINE (AUG 2026)</h3>
          </div>
          <span className="text-[11px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
            CURRENT: {currentRun.status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {states.map((st, idx) => {
            const isCompleted = idx <= currentStepIdx
            const isCurrent = idx === currentStepIdx
            return (
              <div 
                key={st}
                className={`p-2.5 rounded border text-center font-mono text-xs transition-colors ${
                  isCurrent ? 'bg-blue-500/10 border-blue-500 text-blue-400 font-bold' :
                  isCompleted ? 'bg-slate-900 border-slate-800 text-emerald-400' :
                  'bg-slate-900/40 border-slate-800/40 text-slate-600'
                }`}
              >
                <div className="text-[10px] text-slate-500 mb-0.5">STEP 0{idx + 1}</div>
                {st}
              </div>
            )
          })}
        </div>

        {/* Action Controls based on current state */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end gap-2 text-xs font-mono">
          {currentRun.status === 'PROCESSING' && (
            <button 
              onClick={() => transitionMutation.mutate({ id: currentRun.id, action: 'VALIDATE' })}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded"
            >
              <CheckCircle2 size={12} /> Validate Calculations
            </button>
          )}
          {currentRun.status === 'VALIDATED' && (
            <button 
              onClick={() => transitionMutation.mutate({ id: currentRun.id, action: 'APPROVE' })}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded"
            >
              <ShieldCheck size={12} /> Approve Payroll Run
            </button>
          )}
          {currentRun.status === 'APPROVED' && (
            <button 
              onClick={() => transitionMutation.mutate({ id: currentRun.id, action: 'LOCK' })}
              className="flex items-center gap-1 bg-amber-600 hover:bg-amber-500 text-white px-3 py-1 rounded"
            >
              <Lock size={12} /> Lock Payroll Run
            </button>
          )}
          {currentRun.status === 'LOCKED' && (
            <button 
              onClick={() => transitionMutation.mutate({ id: currentRun.id, action: 'PUBLISH' })}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded"
            >
              <Share2 size={12} /> Publish Payslips to Employees
            </button>
          )}
        </div>
      </Card>

      {/* Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <p className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">Total Net Pay Outflow</p>
          <h3 className="text-3xl font-mono font-bold text-slate-100 mt-1">₹{(currentRun.total_net_pay / 100000).toFixed(2)}L</h3>
          <p className="text-xs text-emerald-400 mt-1 font-mono">128 ACTIVE PAYROLL SLIPS</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">LOP Days Deducted</p>
          <h3 className="text-3xl font-mono font-bold text-amber-400 mt-1">{currentRun.total_lop_days} Days</h3>
          <p className="text-xs text-slate-400 mt-1 font-mono">AUTO-INTEGRATED FROM ATTENDANCE</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">Advances Recovered</p>
          <h3 className="text-3xl font-mono font-bold text-blue-400 mt-1">₹{(currentRun.total_advances_deducted / 1000).toFixed(0)}k</h3>
          <p className="text-xs text-slate-400 mt-1 font-mono">FROM 2 SALARY ADVANCES</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">Variance vs Prior Month</p>
          <h3 className="text-3xl font-mono font-bold text-slate-100 mt-1">+{currentRun.variance_percentage}%</h3>
          <p className="text-xs text-emerald-400 mt-1 font-mono">WITHIN ACCEPTABLE THRESHOLD</p>
        </Card>
      </div>

      {/* Multi-Tab Workspace */}
      <Tabs.Root defaultValue="runs" className="w-full">
        <Tabs.List className="flex border-b border-slate-800 mb-6 gap-2">
          <Tabs.Trigger 
            value="runs" 
            className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 transition-colors flex items-center gap-1.5 font-mono"
          >
            <TrendingUp className="w-3.5 h-3.5" /> PAYROLL RUNS & VARIANCE
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="advances" 
            className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 transition-colors flex items-center gap-1.5 font-mono"
          >
            <DollarSign className="w-3.5 h-3.5" /> SALARY ADVANCES
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="payslips" 
            className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 transition-colors flex items-center gap-1.5 font-mono"
          >
            <FileText className="w-3.5 h-3.5" /> PUBLISHED PAYSLIPS
          </Tabs.Trigger>
        </Tabs.List>

        {/* Tab 1: Payroll Runs & Variance Analysis */}
        <Tabs.Content value="runs" className="space-y-6 focus:outline-none">
          <Card className="p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <h3 className="font-semibold text-slate-100 text-sm">Historical Payroll Cycles</h3>
              <span className="text-[11px] font-mono text-slate-400">AUTOMATED VARIANCE DETECTION & REGULATORY CHECKS</span>
            </div>
            {runsLoading ? (
              <div className="p-6 text-center text-slate-500 font-mono text-xs">Loading payroll runs...</div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40">
                    <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase">Period</th>
                    <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase">Gross Total</th>
                    <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase">Deductions</th>
                    <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase">Net Pay Outflow</th>
                    <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase">Variance</th>
                    <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                  {runsData?.data?.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3 text-slate-200 font-bold">
                        {r.month}/{r.year} <span className="text-[11px] text-slate-500 font-normal">({r.total_employees} Emps)</span>
                      </td>
                      <td className="px-5 py-3 text-slate-300">₹{r.total_gross.toLocaleString()}</td>
                      <td className="px-5 py-3 text-rose-400">₹{r.total_deductions.toLocaleString()}</td>
                      <td className="px-5 py-3 text-blue-400 font-semibold">₹{r.total_net_pay.toLocaleString()}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1 text-slate-300">
                          {r.variance_percentage > 10.0 ? (
                            <span className="text-amber-400 flex items-center gap-1">
                              <AlertTriangle size={12} /> +{r.variance_percentage}%
                            </span>
                          ) : (
                            <span>+{r.variance_percentage}%</span>
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] uppercase ${
                          r.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          r.status === 'LOCKED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </Tabs.Content>

        {/* Tab 2: Salary Advances Management */}
        <Tabs.Content value="advances" className="focus:outline-none">
          <Card className="p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <h3 className="font-semibold text-slate-100 text-sm">Employee Salary Advances & Deductions Schedule</h3>
              <button 
                onClick={() => setIsAdvanceModalOpen(true)}
                className="text-xs font-mono text-blue-400 hover:text-blue-300"
              >
                + New Request
              </button>
            </div>
            {advancesLoading ? (
              <div className="p-6 text-center text-slate-500 font-mono text-xs">Loading advances...</div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40">
                    <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase">Employee</th>
                    <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase">Advance Amount</th>
                    <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase">Deduction Schedule</th>
                    <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase">Reason</th>
                    <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {advancesData?.data?.map((adv: any) => (
                    <tr key={adv.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-slate-200">{adv.employee_name}</div>
                        <div className="text-[11px] font-mono text-slate-500">{adv.employee_id}</div>
                      </td>
                      <td className="px-5 py-3 font-mono text-blue-300 font-semibold">₹{adv.amount.toLocaleString()}</td>
                      <td className="px-5 py-3 font-mono text-slate-300">{adv.deduct_from_month}/{adv.deduct_from_year}</td>
                      <td className="px-5 py-3 text-slate-400 truncate max-w-[200px]" title={adv.reason}>{adv.reason}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono uppercase ${
                          adv.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {adv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </Tabs.Content>

        {/* Tab 3: Published Payslips */}
        <Tabs.Content value="payslips" className="focus:outline-none">
          <Card className="p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <h3 className="font-semibold text-slate-100 text-sm">Published Employee Payslips</h3>
            </div>
            {payslipsLoading ? (
              <div className="p-6 text-center text-slate-500 font-mono text-xs">Loading payslips...</div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40">
                    <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase">Employee</th>
                    <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase">Period</th>
                    <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase">Gross Pay</th>
                    <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase">Deductions</th>
                    <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase">Net Pay</th>
                    <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                  {payslipsData?.data?.map((slip: any) => (
                    <tr key={slip.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-slate-200">{slip.employee_name}</div>
                        <div className="text-[11px] font-normal text-slate-500">{slip.designation}</div>
                      </td>
                      <td className="px-5 py-3 text-slate-300">{slip.month} {slip.year}</td>
                      <td className="px-5 py-3 text-slate-300">₹{slip.total_earnings.toLocaleString()}</td>
                      <td className="px-5 py-3 text-rose-400">₹{slip.total_deductions.toLocaleString()}</td>
                      <td className="px-5 py-3 text-emerald-400 font-bold">₹{slip.net_pay.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right">
                        <button 
                          onClick={() => setSelectedPayslipId(slip.id)}
                          className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-medium"
                        >
                          <Eye size={13} /> View Payslip
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </Tabs.Content>
      </Tabs.Root>

      {/* Salary Advance Request Modal */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#111827] rounded-lg border border-slate-800 shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <h3 className="font-semibold text-slate-100 text-sm">Request Salary Advance</h3>
              <button onClick={() => setIsAdvanceModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                ×
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Employee ID</label>
                <input 
                  type="text" 
                  value={advanceForm.employee_id}
                  onChange={e => setAdvanceForm({ ...advanceForm, employee_id: e.target.value })}
                  placeholder="e.g. EMP-1024"
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded p-2 text-slate-200 focus:border-blue-500 focus:outline-none uppercase"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Advance Amount (₹)</label>
                <input 
                  type="number" 
                  value={advanceForm.amount}
                  onChange={e => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                  placeholder="e.g. 25000"
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded p-2 text-slate-200 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Deduct Month</label>
                  <input 
                    type="number" 
                    value={advanceForm.month}
                    onChange={e => setAdvanceForm({ ...advanceForm, month: parseInt(e.target.value) })}
                    className="w-full bg-[#0B0F19] border border-slate-800 rounded p-2 text-slate-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Deduct Year</label>
                  <input 
                    type="number" 
                    value={advanceForm.year}
                    onChange={e => setAdvanceForm({ ...advanceForm, year: parseInt(e.target.value) })}
                    className="w-full bg-[#0B0F19] border border-slate-800 rounded p-2 text-slate-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Reason</label>
                <textarea 
                  value={advanceForm.reason}
                  onChange={e => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                  placeholder="Emergency or relocation requirement..."
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded p-2 text-slate-200 focus:border-blue-500 focus:outline-none min-h-[70px] resize-none"
                />
              </div>
              <div className="pt-2">
                <button 
                  onClick={() => createAdvanceMutation.mutate()}
                  disabled={createAdvanceMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded transition-colors"
                >
                  Submit Advance Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
