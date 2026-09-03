import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '../../components/ui/Card'
import { Globe, Calculator, CheckCircle2, AlertTriangle, ArrowRightLeft, ShieldCheck, Edit3 } from 'lucide-react'

interface Currency {
  code: string
  name: string
  symbol: string
  exchange_rate_to_base: number
  is_base: boolean
}

interface ComponentAmount {
  code: string
  name: string
  amount: number
}

interface SalaryBreakdown {
  base_salary: number
  currency_code: string
  currency_symbol: string
  gross_earnings: number
  total_deductions: number
  net_pay: number
  earnings: ComponentAmount[]
  deductions: ComponentAmount[]
}

export const SalaryMatrixConsole = () => {
  const qc = useQueryClient()
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Interactive Simulator State
  const [simBaseSalary, setSimBaseSalary] = useState('100000')
  const [simCurrency, setSimCurrency] = useState('INR')

  // Edit Currency Rate State
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null)

  // Fetch Currencies
  const { data: currRes } = useQuery({
    queryKey: ['payroll-currencies'],
    queryFn: async () => {
      const res = await fetch('/api/v1/payroll/currencies', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to load currencies')
      return res.json()
    }
  })

  // Calculate Breakdown Preview Mutation
  const { data: breakdownRes } = useQuery({
    queryKey: ['payroll-breakdown-preview', simBaseSalary, simCurrency],
    queryFn: async () => {
      const amount = parseFloat(simBaseSalary) || 0
      if (amount <= 0) return null
      const res = await fetch('/api/v1/payroll/calculate-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ base_salary: amount, currency_code: simCurrency })
      })
      if (!res.ok) throw new Error('Failed to calculate breakdown')
      return res.json()
    },
    enabled: parseFloat(simBaseSalary) > 0
  })

  // Save Currency Rate Mutation
  const saveCurrMut = useMutation({
    mutationFn: async (curr: Currency) => {
      const res = await fetch('/api/v1/payroll/currencies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(curr)
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error || 'Failed to update currency')
      return data
    },
    onSuccess: () => {
      setEditingCurrency(null)
      setSuccessMsg('Currency exchange rate updated.')
      qc.invalidateQueries({ queryKey: ['payroll-currencies'] })
    },
    onError: (err: any) => {
      setErrorMsg(err.message)
    }
  })

  const currencies: Currency[] = currRes?.data || []
  const breakdown: SalaryBreakdown | null = breakdownRes?.data || null

  return (
    <div className="space-y-6 font-sans">
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-3 rounded text-xs font-mono flex items-center justify-between">
          <span className="flex items-center gap-1.5"><CheckCircle2 size={14} /> {successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="font-bold">×</button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3 rounded text-xs font-mono flex items-center justify-between">
          <span className="flex items-center gap-1.5"><AlertTriangle size={14} /> {errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="font-bold">×</button>
        </div>
      )}

      {/* Header Banner */}
      <Card className="p-6 bg-[var(--bg-card)] border-[var(--border-color)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2">
              <Globe size={18} className="theme-accent-text" />
              Multi-Currency Salary Structures & Component Matrix
            </h3>
            <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
              Configure global currency exchange rates, statutory allowances, tax deductions, and simulate live compensation structures.
            </p>
          </div>
        </div>
      </Card>

      {/* Currency Board */}
      <Card className="p-6 space-y-4 bg-[var(--bg-card)] border-[var(--border-color)]">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <h4 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
            <ArrowRightLeft size={16} className="text-emerald-500" />
            Global Currency Exchange Rate Matrix ({currencies.length})
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 font-mono text-xs">
          {currencies.map(c => (
            <div key={c.code} className="bg-[var(--bg-subtle)] border border-[var(--border-color)] p-3.5 rounded-lg space-y-2 relative group hover:border-[var(--color-primary)] transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[var(--text-main)]">{c.code} ({c.symbol})</span>
                {c.is_base ? (
                  <span className="bg-emerald-500/10 text-emerald-500 text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/20 font-semibold">
                    BASE
                  </span>
                ) : (
                  <button
                    onClick={() => setEditingCurrency(c)}
                    className="text-[var(--text-muted)] hover:theme-accent-text transition-colors"
                  >
                    <Edit3 size={13} />
                  </button>
                )}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] truncate">{c.name}</div>
              <div className="text-[var(--text-main)] font-bold">
                1 INR = {c.exchange_rate_to_base} {c.code}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Live Breakdown Calculator Simulator */}
      <Card className="p-6 space-y-5 bg-[var(--bg-card)] border-[var(--border-color)]">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <h4 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
            <Calculator size={16} className="theme-accent-text" />
            Interactive Salary Structure Breakdown Simulator
          </h4>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div>
            <label className="block text-[var(--text-muted)] mb-1">Gross Base Salary</label>
            <input
              type="number"
              value={simBaseSalary}
              onChange={e => setSimBaseSalary(e.target.value)}
              className="w-full bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded p-2.5 text-[var(--text-main)] focus:outline-none focus:border-[var(--color-primary)] text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-[var(--text-muted)] mb-1">Currency</label>
            <select
              value={simCurrency}
              onChange={e => setSimCurrency(e.target.value)}
              className="w-full bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded p-2.5 text-[var(--text-main)] focus:outline-none focus:border-[var(--color-primary)] text-sm"
            >
              {currencies.map(c => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol}) — {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-[var(--bg-subtle)] border border-[var(--border-color)] p-3 rounded flex items-center justify-between">
            <div>
              <div className="text-[var(--text-muted)] text-[11px]">Net Monthly Payout</div>
              <div className="text-xl font-bold text-emerald-500 mt-0.5">
                {breakdown ? `${breakdown.currency_symbol}${breakdown.net_pay.toLocaleString()}` : '—'}
              </div>
            </div>
            <ShieldCheck size={28} className="text-emerald-500/40" />
          </div>
        </div>

        {/* Results Matrix */}
        {breakdown && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 font-mono text-xs">
            {/* Earnings Column */}
            <div className="space-y-3 bg-[var(--bg-subtle)] p-4 rounded-lg border border-[var(--border-color)]">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                <span className="font-bold text-emerald-500 uppercase tracking-wider">Gross Earnings Breakdown</span>
                <span className="font-bold text-emerald-500">{breakdown.currency_symbol}{breakdown.gross_earnings.toLocaleString()}</span>
              </div>
              <div className="space-y-2">
                {breakdown.earnings.map(e => (
                  <div key={e.code} className="flex justify-between text-[var(--text-main)]">
                    <span>{e.name}</span>
                    <span className="font-semibold text-[var(--text-main)]">{breakdown.currency_symbol}{e.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Deductions Column */}
            <div className="space-y-3 bg-[var(--bg-subtle)] p-4 rounded-lg border border-[var(--border-color)]">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                <span className="font-bold text-rose-500 uppercase tracking-wider">Statutory Deductions</span>
                <span className="font-bold text-rose-500">-{breakdown.currency_symbol}{breakdown.total_deductions.toLocaleString()}</span>
              </div>
              <div className="space-y-2">
                {breakdown.deductions.map(d => (
                  <div key={d.code} className="flex justify-between text-[var(--text-main)]">
                    <span>{d.name}</span>
                    <span className="font-semibold text-rose-500">-{breakdown.currency_symbol}{d.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Edit Currency Modal */}
      {editingCurrency && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg w-full max-w-sm p-6 space-y-4 animate-scale-in text-[var(--text-main)]">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                <Globe size={16} className="theme-accent-text" />
                Update Exchange Rate for {editingCurrency.code}
              </h3>
              <button onClick={() => setEditingCurrency(null)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] font-bold">×</button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-[var(--text-muted)] mb-1">Currency Code</label>
                <input type="text" disabled value={editingCurrency.code} className="w-full bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded p-2 text-[var(--text-muted)]" />
              </div>
              <div>
                <label className="block text-[var(--text-muted)] mb-1">Exchange Rate (Relative to 1 Base Unit)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={editingCurrency.exchange_rate_to_base}
                  onChange={e => setEditingCurrency({ ...editingCurrency, exchange_rate_to_base: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded p-2 text-[var(--text-main)] focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEditingCurrency(null)} className="px-3 py-1.5 rounded text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-main)]">Cancel</button>
              <button
                onClick={() => saveCurrMut.mutate(editingCurrency)}
                disabled={saveCurrMut.isPending}
                className="theme-accent-bg hover:opacity-90 text-white px-4 py-1.5 rounded text-xs font-mono font-medium transition-colors shadow-sm"
              >
                Save Rate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
