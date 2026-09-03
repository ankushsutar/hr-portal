import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Download, Printer, FileCheck } from 'lucide-react'
import { Card } from '../../components/ui/Card'

export const PayslipView = ({ id, onBack }: { id: string; onBack: () => void }) => {
  const { data, isLoading } = useQuery({ 
    queryKey: ['payslipDetails', id], 
    queryFn: async () => {
      const res = await fetch(`/api/v1/payroll/payslips/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('hrms_token') || localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to fetch payslip details')
      return res.json()
    }
  })

  if (isLoading) return <div className="text-center py-12 text-[var(--text-muted)] font-mono text-xs">Loading payslip record...</div>

  const slip = data?.data

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in font-sans">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors font-mono text-xs"
        >
          <ArrowLeft size={14} /> Back to Console
        </button>
        <div className="flex gap-2">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-color)] text-[var(--text-main)] rounded text-xs font-mono hover:bg-[var(--bg-hover)] transition-colors"
          >
            <Printer size={13} /> Print
          </button>
          <button 
            onClick={() => alert('PDF payslip download initiated.')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 theme-accent-bg hover:opacity-90 text-white rounded text-xs font-mono font-medium transition-colors shadow-sm"
          >
            <Download size={13} /> Export PDF
          </button>
        </div>
      </div>

      <Card className="p-8 bg-[var(--bg-card)] border border-[var(--border-color)] space-y-6 text-[var(--text-main)]">
        <div className="text-center border-b border-[var(--border-color)] pb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <FileCheck className="w-5 h-5 theme-accent-text" />
            <h1 className="text-lg font-bold text-[var(--text-main)] font-mono uppercase tracking-wider">TechCorp Solutions Pvt. Ltd.</h1>
          </div>
          <p className="text-xs text-[var(--text-muted)] font-mono">CONFIDENTIAL SALARY PAYSLIP — FOR {slip?.month?.toUpperCase()} {slip?.year}</p>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-xs font-mono border-b border-[var(--border-color)] pb-6">
          <div>
            <span className="text-[var(--text-muted)] block mb-0.5">EMPLOYEE NAME</span>
            <span className="font-semibold text-[var(--text-main)]">{slip?.employee_name} ({slip?.employee_id})</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)] block mb-0.5">DESIGNATION / DEPT</span>
            <span className="font-semibold text-[var(--text-main)]">{slip?.designation} • {slip?.department}</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)] block mb-0.5">PAN NUMBER</span>
            <span className="text-[var(--text-main)]">ABCDE1234F</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)] block mb-0.5">UAN / PF NUMBER</span>
            <span className="text-[var(--text-main)]">100908070605</span>
          </div>
        </div>

        <div className="grid grid-cols-2 border border-[var(--border-color)] rounded overflow-hidden text-xs">
          {/* Earnings */}
          <div className="border-r border-[var(--border-color)]">
            <div className="bg-[var(--bg-subtle)] px-4 py-2 border-b border-[var(--border-color)] font-mono font-semibold text-[var(--text-main)]">
              EARNINGS
            </div>
            <div className="p-4 space-y-2 font-mono">
              <div className="flex justify-between text-[var(--text-main)]">
                <span>Basic Pay</span>
                <span>₹{(slip?.basic_pay || 45000).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[var(--text-main)]">
                <span>HRA</span>
                <span>₹{(slip?.hra || 22500).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[var(--text-main)]">
                <span>Special Allowance</span>
                <span>₹{(slip?.special_allowance || 12500).toLocaleString()}</span>
              </div>
            </div>
            <div className="bg-[var(--bg-subtle)]/60 px-4 py-2.5 border-t border-[var(--border-color)] flex justify-between font-mono font-bold text-[var(--text-main)]">
              <span>Gross Earnings</span>
              <span>₹{(slip?.total_earnings || 80000).toLocaleString()}</span>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <div className="bg-[var(--bg-subtle)] px-4 py-2 border-b border-[var(--border-color)] font-mono font-semibold text-[var(--text-main)]">
              DEDUCTIONS
            </div>
            <div className="p-4 space-y-2 font-mono text-[var(--text-main)]">
              <div className="flex justify-between">
                <span>Provident Fund (PF)</span>
                <span className="text-rose-500">₹{(slip?.pf || 1800).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax Deducted (TDS)</span>
                <span className="text-rose-500">₹{(slip?.tds || 3200).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Professional Tax</span>
                <span className="text-rose-500">₹{(slip?.ptax || 200).toLocaleString()}</span>
              </div>
              {slip?.advance_deduction > 0 && (
                <div className="flex justify-between text-amber-500">
                  <span>Salary Advance</span>
                  <span>₹{slip.advance_deduction.toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="bg-[var(--bg-subtle)]/60 px-4 py-2.5 border-t border-[var(--border-color)] flex justify-between font-mono font-bold text-rose-500">
              <span>Total Deductions</span>
              <span>₹{(slip?.total_deductions || 10200).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between bg-[var(--color-primary)]/10 p-5 rounded border border-[var(--color-primary)]/20 font-mono">
          <div>
            <h4 className="theme-accent-text font-bold text-base">NET DISBURSED PAY</h4>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">DIRECT DEPOSIT TO SALARY BANK ACCOUNT</p>
          </div>
          <div className="text-2xl font-bold text-emerald-500">
            ₹{(slip?.net_pay || 69800).toLocaleString()}
          </div>
        </div>
        
        <p className="text-[11px] text-center text-[var(--text-muted)] font-mono pt-2">
          This is an electronically generated document authorized by TechCorp HRMS Core.
        </p>
      </Card>
    </div>
  )
}
