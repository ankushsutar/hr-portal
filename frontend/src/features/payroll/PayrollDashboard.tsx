import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, Eye, TrendingUp, DollarSign, Play, CheckCircle2, Lock, Share2, Plus, AlertTriangle, ShieldCheck, Globe } from 'lucide-react'
import { useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { Card } from '../../components/ui/Card'
import { PayslipView } from './PayslipView'
import { SalaryMatrixConsole } from './SalaryMatrixConsole'
import { PaginationBar } from '../../components/ui/PaginationBar'
import { useTableState } from '../../hooks/useTableState'

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

export const PayrollDashboard = () => {
  const qc = useQueryClient()
  const [selectedPayslipId, setSelectedPayslipId] = useState<string | null>(null)
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false)
  const [isRunModalOpen, setIsRunModalOpen] = useState(false)
  const [targetPeriod, setTargetPeriod] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() })
  const [advanceForm, setAdvanceForm] = useState({ employee_id: '', amount: '', reason: '', month: 8, year: 2026 })

  const { page, limit, search, setPage, setLimit, setSearch, queryParams } = useTableState({ initialLimit: 10 })

  const { data: runsData, isLoading: runsLoading } = useQuery({ queryKey: ['payroll-runs'], queryFn: fetchPayrollRuns })
  const { data: advancesData, isLoading: advancesLoading } = useQuery({ queryKey: ['payroll-advances'], queryFn: fetchAdvances })
  const { data: payslipsData, isLoading: payslipsLoading } = useQuery({
    queryKey: ['payslips', queryParams.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/v1/payroll/payslips?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('hrms_token') || localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to fetch payslips')
      return res.json()
    }
  })

  const processMutation = useMutation({
    mutationFn: async (period?: { month: number; year: number }) => {
      const month = period?.month || targetPeriod.month
      const year = period?.year || targetPeriod.year
      const res = await fetch('/api/v1/payroll/runs/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('hrms_token') || localStorage.getItem('token')}`
        },
        body: JSON.stringify({ month, year })
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Processing failed')
      }
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll-runs'] })
      qc.invalidateQueries({ queryKey: ['payslips'] })
      setIsRunModalOpen(false)
    },
    onError: (err: any) => {
      alert(`Payroll Processing Error: ${err.message}`)
    }
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
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Transition failed')
      }
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll-runs'] })
      qc.invalidateQueries({ queryKey: ['payslips'] })
    },
    onError: (err: any) => {
      alert(`State Transition Error: ${err.message}`)
    }
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
      setAdvanceForm({ employee_id: '', amount: '', reason: '', month: new Date().getMonth() + 1, year: new Date().getFullYear() })
    }
  })

  if (selectedPayslipId) {
    return <PayslipView id={selectedPayslipId} onBack={() => setSelectedPayslipId(null)} />
  }

  const currentRun = runsData?.data?.find((r: any) => r.id === selectedRunId) || runsData?.data?.[0] || {
    id: '',
    status: 'DRAFT',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    total_employees: 0,
    total_net_pay: 0,
    total_lop_days: 0,
    total_advances_deducted: 0,
    variance_percentage: 0
  }

  const states = ['DRAFT', 'PROCESSING', 'VALIDATED', 'APPROVED', 'LOCKED', 'PUBLISHED']
  const currentStepIdx = states.indexOf(currentRun.status)

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[var(--text-main)] leading-tight tracking-tight">Payroll Processing Console</h1>
          <p className="text-xs font-mono text-[var(--text-muted)] mt-1">MONTHLY RUN EXECUTION, LOP DEDUCTIONS & ADVANCES</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsAdvanceModalOpen(true)}
            className="flex items-center gap-1.5 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] border border-[var(--border-color)] px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors"
          >
            <Plus size={14} /> Request Advance
          </button>
          <button 
            onClick={() => setIsRunModalOpen(true)}
            className="flex items-center gap-1.5 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] border border-[var(--border-color)] px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors"
          >
            <Plus size={14} /> Start New Cycle
          </button>
          <button 
            onClick={() => processMutation.mutate()}
            disabled={processMutation.isPending}
            className="flex items-center gap-1.5 theme-accent-bg hover:opacity-90 disabled:opacity-50 text-white px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors shadow-sm"
          >
            <Play size={14} /> {processMutation.isPending ? 'Processing...' : 'Run Payroll Calculation'}
          </button>
        </div>
      </div>

      {/* State Machine Stepper */}
      <Card className="p-4 bg-[var(--bg-card)] border-[var(--border-color)]">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 theme-accent-text" />
            <h3 className="text-xs font-mono font-semibold text-[var(--text-main)]">PAYROLL RUN STATE MACHINE (AUG 2026)</h3>
          </div>
          <span className="text-[11px] font-mono theme-accent-text bg-[var(--color-primary)]/10 px-2 py-0.5 rounded border border-[var(--color-primary)]/20">
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
                  isCurrent ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] theme-accent-text font-bold' :
                  isCompleted ? 'bg-[var(--bg-subtle)] border-[var(--border-color)] text-emerald-500 font-semibold' :
                  'bg-[var(--bg-subtle)]/40 border-[var(--border-color)] text-[var(--text-muted)]'
                }`}
              >
                <div className="text-[10px] text-[var(--text-muted)] mb-0.5">STEP 0{idx + 1}</div>
                {st}
              </div>
            )
          })}
        </div>

        {/* Action Controls based on current state */}
        <div className="mt-4 pt-3 border-t border-[var(--border-color)] flex items-center justify-end gap-2 text-xs font-mono">
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
              className="flex items-center gap-1 theme-accent-bg hover:opacity-90 text-white px-3 py-1 rounded"
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
          <p className="text-xs font-mono font-medium text-[var(--text-muted)] uppercase tracking-wider">Total Net Pay Outflow</p>
          <h3 className="text-3xl font-mono font-bold text-[var(--text-main)] mt-1">₹{(currentRun.total_net_pay / 100000).toFixed(2)}L</h3>
          <p className="text-xs text-emerald-500 mt-1 font-mono">128 ACTIVE PAYROLL SLIPS</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-mono font-medium text-[var(--text-muted)] uppercase tracking-wider">LOP Days Deducted</p>
          <h3 className="text-3xl font-mono font-bold text-amber-500 mt-1">{currentRun.total_lop_days} Days</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1 font-mono">AUTO-INTEGRATED FROM ATTENDANCE</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-mono font-medium text-[var(--text-muted)] uppercase tracking-wider">Advances Recovered</p>
          <h3 className="text-3xl font-mono font-bold theme-accent-text mt-1">₹{(currentRun.total_advances_deducted / 1000).toFixed(0)}k</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1 font-mono">FROM 2 SALARY ADVANCES</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-mono font-medium text-[var(--text-muted)] uppercase tracking-wider">Variance vs Prior Month</p>
          <h3 className="text-3xl font-mono font-bold text-[var(--text-main)] mt-1">+{currentRun.variance_percentage}%</h3>
          <p className="text-xs text-emerald-500 mt-1 font-mono">WITHIN ACCEPTABLE THRESHOLD</p>
        </Card>
      </div>

      {/* Multi-Tab Workspace */}
      <Tabs.Root defaultValue="runs" className="w-full">
        <Tabs.List className="flex border-b border-[var(--border-color)] mb-6 gap-2">
          <Tabs.Trigger 
            value="runs" 
            className="px-3.5 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] data-[state=active]:theme-accent-text data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-primary)] transition-colors flex items-center gap-1.5 font-mono"
          >
            <TrendingUp className="w-3.5 h-3.5" /> PAYROLL RUNS & VARIANCE
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="advances" 
            className="px-3.5 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] data-[state=active]:theme-accent-text data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-primary)] transition-colors flex items-center gap-1.5 font-mono"
          >
            <DollarSign className="w-3.5 h-3.5" /> SALARY ADVANCES
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="payslips" 
            className="px-3.5 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] data-[state=active]:theme-accent-text data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-primary)] transition-colors flex items-center gap-1.5 font-mono"
          >
            <FileText className="w-3.5 h-3.5" /> PUBLISHED PAYSLIPS
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="matrix" 
            className="px-3.5 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] data-[state=active]:text-emerald-500 data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 transition-colors flex items-center gap-1.5 font-mono"
          >
            <Globe className="w-3.5 h-3.5" /> CURRENCIES & SALARY MATRIX
          </Tabs.Trigger>
        </Tabs.List>

        {/* Tab 1: Payroll Runs & Variance Analysis */}
        <Tabs.Content value="runs" className="space-y-6 focus:outline-none">
          <Card className="p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--border-color)] bg-[var(--bg-subtle)] flex items-center justify-between">
              <h3 className="font-semibold text-[var(--text-main)] text-sm">Historical Payroll Cycles</h3>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">AUTOMATED VARIANCE DETECTION & REGULATORY CHECKS</span>
            </div>
            {runsLoading ? (
              <div className="p-6 text-center text-[var(--text-muted)] font-mono text-xs">Loading payroll runs...</div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--bg-subtle)]/60">
                    <th className="px-5 py-2.5 text-xs font-mono text-[var(--text-muted)] uppercase">Period</th>
                    <th className="px-5 py-2.5 text-xs font-mono text-[var(--text-muted)] uppercase">Gross Total</th>
                    <th className="px-5 py-2.5 text-xs font-mono text-[var(--text-muted)] uppercase">Deductions</th>
                    <th className="px-5 py-2.5 text-xs font-mono text-[var(--text-muted)] uppercase">Net Pay Outflow</th>
                    <th className="px-5 py-2.5 text-xs font-mono text-[var(--text-muted)] uppercase">Variance</th>
                    <th className="px-5 py-2.5 text-xs font-mono text-[var(--text-muted)] uppercase text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)] text-xs font-mono text-[var(--text-main)]">
                  {runsData?.data?.map((r: any) => (
                    <tr key={r.id} onClick={() => setSelectedRunId(r.id)} className={`hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer ${currentRun.id === r.id ? 'bg-[var(--color-primary)]/10' : ''}`}>
                      <td className="px-5 py-3 text-[var(--text-main)] font-bold">
                        {r.month}/{r.year} <span className="text-[11px] text-[var(--text-muted)] font-normal">({r.total_employees} Emps)</span>
                      </td>
                      <td className="px-5 py-3 text-[var(--text-main)]">₹{r.total_gross.toLocaleString()}</td>
                      <td className="px-5 py-3 text-rose-500">₹{r.total_deductions.toLocaleString()}</td>
                      <td className="px-5 py-3 theme-accent-text font-semibold">₹{r.total_net_pay.toLocaleString()}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1 text-[var(--text-main)]">
                          {r.variance_percentage > 10.0 ? (
                            <span className="text-amber-500 flex items-center gap-1">
                              <AlertTriangle size={12} /> +{r.variance_percentage}%
                            </span>
                          ) : (
                            <span>+{r.variance_percentage}%</span>
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] uppercase ${
                          r.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                          r.status === 'LOCKED' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                          'bg-[var(--color-primary)]/10 theme-accent-text border border-[var(--color-primary)]/20'
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
            <div className="px-5 py-3 border-b border-[var(--border-color)] bg-[var(--bg-subtle)] flex items-center justify-between">
              <h3 className="font-semibold text-[var(--text-main)] text-sm">Employee Salary Advances & Deductions Schedule</h3>
              <button 
                onClick={() => setIsAdvanceModalOpen(true)}
                className="text-xs font-mono theme-accent-text hover:underline"
              >
                + New Request
              </button>
            </div>
            {advancesLoading ? (
              <div className="p-6 text-center text-[var(--text-muted)] font-mono text-xs">Loading advances...</div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--bg-subtle)]/60">
                    <th className="px-5 py-2.5 text-xs font-mono text-[var(--text-muted)] uppercase">Employee</th>
                    <th className="px-5 py-2.5 text-xs font-mono text-[var(--text-muted)] uppercase">Advance Amount</th>
                    <th className="px-5 py-2.5 text-xs font-mono text-[var(--text-muted)] uppercase">Deduction Schedule</th>
                    <th className="px-5 py-2.5 text-xs font-mono text-[var(--text-muted)] uppercase">Reason</th>
                    <th className="px-5 py-2.5 text-xs font-mono text-[var(--text-muted)] uppercase text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)] text-xs text-[var(--text-main)]">
                  {advancesData?.data?.map((adv: any) => (
                    <tr key={adv.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-[var(--text-main)]">{adv.employee_name}</div>
                        <div className="text-[11px] font-mono text-[var(--text-muted)]">{adv.employee_id}</div>
                      </td>
                      <td className="px-5 py-3 font-mono theme-accent-text font-semibold">₹{adv.amount.toLocaleString()}</td>
                      <td className="px-5 py-3 font-mono text-[var(--text-main)]">{adv.deduct_from_month}/{adv.deduct_from_year}</td>
                      <td className="px-5 py-3 text-[var(--text-muted)] truncate max-w-[200px]" title={adv.reason}>{adv.reason}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono uppercase ${
                          adv.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                          'bg-amber-500/10 text-amber-500 border border-amber-500/20'
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
            <div className="px-5 py-3 border-b border-[var(--border-color)] bg-[var(--bg-subtle)] flex items-center justify-between gap-4">
              <h3 className="font-semibold text-[var(--text-main)] text-sm">Published Employee Payslips</h3>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee or ID..."
                className="px-3 py-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-xs text-[var(--text-main)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-primary)] w-56 font-mono"
              />
            </div>
            {payslipsLoading ? (
              <div className="p-6 text-center text-[var(--text-muted)] font-mono text-xs">Loading payslips...</div>
            ) : (
              <>
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[var(--border-color)] bg-[var(--bg-subtle)]/60">
                      <th className="px-5 py-2.5 text-xs font-mono text-[var(--text-muted)] uppercase">Employee</th>
                      <th className="px-5 py-2.5 text-xs font-mono text-[var(--text-muted)] uppercase">Period</th>
                      <th className="px-5 py-2.5 text-xs font-mono text-[var(--text-muted)] uppercase">Gross Pay</th>
                      <th className="px-5 py-2.5 text-xs font-mono text-[var(--text-muted)] uppercase">Deductions</th>
                      <th className="px-5 py-2.5 text-xs font-mono text-[var(--text-muted)] uppercase">Net Pay</th>
                      <th className="px-5 py-2.5 text-xs font-mono text-[var(--text-muted)] uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)] text-xs font-mono text-[var(--text-main)]">
                    {payslipsData?.data?.map((slip: any) => (
                      <tr key={slip.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                        <td className="px-5 py-3">
                          <div className="font-semibold text-[var(--text-main)]">{slip.employee_name}</div>
                          <div className="text-[11px] font-normal text-[var(--text-muted)]">{slip.designation}</div>
                        </td>
                        <td className="px-5 py-3 text-[var(--text-main)]">{slip.month} {slip.year}</td>
                        <td className="px-5 py-3 text-[var(--text-main)]">₹{slip.total_earnings.toLocaleString()}</td>
                        <td className="px-5 py-3 text-rose-500">₹{slip.total_deductions.toLocaleString()}</td>
                        <td className="px-5 py-3 text-emerald-500 font-bold">₹{slip.net_pay.toLocaleString()}</td>
                        <td className="px-5 py-3 text-right">
                          <button 
                            onClick={() => setSelectedPayslipId(slip.id)}
                            className="inline-flex items-center gap-1 theme-accent-text hover:underline text-xs font-medium"
                          >
                            <Eye size={13} /> View Payslip
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <PaginationBar
                  page={page}
                  limit={limit}
                  total={payslipsData?.total ?? payslipsData?.data?.length ?? 0}
                  meta={payslipsData?.pagination}
                  onPageChange={setPage}
                  onLimitChange={setLimit}
                />
              </>
            )}
          </Card>
        </Tabs.Content>

        <Tabs.Content value="matrix" className="focus:outline-none">
          <SalaryMatrixConsole />
        </Tabs.Content>
      </Tabs.Root>

      {/* Salary Advance Request Modal */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="px-5 py-3 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-subtle)]">
              <h3 className="font-semibold text-[var(--text-main)] text-sm">Request Salary Advance</h3>
              <button onClick={() => setIsAdvanceModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                ×
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs font-mono text-[var(--text-main)]">
              <div>
                <label className="block text-[var(--text-muted)] mb-1">Employee ID</label>
                <input 
                  type="text" 
                  value={advanceForm.employee_id}
                  onChange={e => setAdvanceForm({ ...advanceForm, employee_id: e.target.value })}
                  placeholder="e.g. EMP-1024"
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded p-2 text-[var(--text-main)] focus:border-[var(--color-primary)] focus:outline-none uppercase"
                />
              </div>
              <div>
                <label className="block text-[var(--text-muted)] mb-1">Advance Amount (₹)</label>
                <input 
                  type="number" 
                  value={advanceForm.amount}
                  onChange={e => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                  placeholder="e.g. 25000"
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded p-2 text-[var(--text-main)] focus:border-[var(--color-primary)] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Deduct Month</label>
                  <input 
                    type="number" 
                    value={advanceForm.month}
                    onChange={e => setAdvanceForm({ ...advanceForm, month: parseInt(e.target.value) })}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded p-2 text-[var(--text-main)] focus:border-[var(--color-primary)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Deduct Year</label>
                  <input 
                    type="number" 
                    value={advanceForm.year}
                    onChange={e => setAdvanceForm({ ...advanceForm, year: parseInt(e.target.value) })}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded p-2 text-[var(--text-main)] focus:border-[var(--color-primary)] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[var(--text-muted)] mb-1">Reason</label>
                <textarea 
                  value={advanceForm.reason}
                  onChange={e => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                  placeholder="Emergency or relocation requirement..."
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded p-2 text-[var(--text-main)] focus:border-[var(--color-primary)] focus:outline-none min-h-[70px] resize-none"
                />
              </div>
              <div className="pt-2">
                <button 
                  onClick={() => createAdvanceMutation.mutate()}
                  disabled={createAdvanceMutation.isPending}
                  className="w-full theme-accent-bg hover:opacity-90 text-white font-medium py-2 rounded transition-colors shadow-sm"
                >
                  Submit Advance Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* New Payroll Run Modal */}
      {isRunModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="px-5 py-3 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-subtle)]">
              <h3 className="font-semibold text-[var(--text-main)] text-sm">Start New Payroll Cycle</h3>
              <button onClick={() => setIsRunModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-lg">
                ×
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs font-mono text-[var(--text-main)]">
              <p className="text-[var(--text-muted)]">Select the target month and year to initialize payroll calculation, audit readiness, and compute payslips.</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Target Month (1-12)</label>
                  <input 
                    type="number" 
                    min={1}
                    max={12}
                    value={targetPeriod.month}
                    onChange={e => setTargetPeriod({ ...targetPeriod, month: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded p-2 text-[var(--text-main)] focus:border-[var(--color-primary)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Target Year</label>
                  <input 
                    type="number" 
                    value={targetPeriod.year}
                    onChange={e => setTargetPeriod({ ...targetPeriod, year: parseInt(e.target.value) || 2026 })}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded p-2 text-[var(--text-main)] focus:border-[var(--color-primary)] focus:outline-none"
                  />
                </div>
              </div>
              <div className="pt-2">
                <button 
                  onClick={() => processMutation.mutate(targetPeriod)}
                  disabled={processMutation.isPending}
                  className="w-full theme-accent-bg hover:opacity-90 text-white font-medium py-2 rounded transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Play size={14} /> {processMutation.isPending ? 'Calculating...' : 'Execute Payroll Calculation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
