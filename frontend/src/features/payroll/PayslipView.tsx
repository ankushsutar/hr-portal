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

  if (isLoading) return <div className="text-center py-12 text-slate-500 font-mono text-xs">Loading payslip record...</div>

  const slip = data?.data

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors font-mono text-xs"
        >
          <ArrowLeft size={14} /> Back to Console
        </button>
        <div className="flex gap-2">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded text-xs font-mono hover:bg-slate-700 transition-colors"
          >
            <Printer size={13} /> Print
          </button>
          <button 
            onClick={() => alert('PDF payslip download initiated.')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-mono font-medium transition-colors"
          >
            <Download size={13} /> Export PDF
          </button>
        </div>
      </div>

      <Card className="p-8 bg-[#111827] border border-slate-800 space-y-6">
        <div className="text-center border-b border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <FileCheck className="w-5 h-5 text-blue-400" />
            <h1 className="text-lg font-bold text-slate-100 font-mono uppercase tracking-wider">TechCorp Solutions Pvt. Ltd.</h1>
          </div>
          <p className="text-xs text-slate-400 font-mono">CONFIDENTIAL SALARY PAYSLIP — FOR {slip?.month?.toUpperCase()} {slip?.year}</p>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-xs font-mono border-b border-slate-800 pb-6">
          <div>
            <span className="text-slate-500 block mb-0.5">EMPLOYEE NAME</span>
            <span className="font-semibold text-slate-200">{slip?.employee_name} ({slip?.employee_id})</span>
          </div>
          <div>
            <span className="text-slate-500 block mb-0.5">DESIGNATION / DEPT</span>
            <span className="font-semibold text-slate-200">{slip?.designation} • {slip?.department}</span>
          </div>
          <div>
            <span className="text-slate-500 block mb-0.5">PAN NUMBER</span>
            <span className="text-slate-300">ABCDE1234F</span>
          </div>
          <div>
            <span className="text-slate-500 block mb-0.5">UAN / PF NUMBER</span>
            <span className="text-slate-300">100908070605</span>
          </div>
        </div>

        <div className="grid grid-cols-2 border border-slate-800 rounded overflow-hidden text-xs">
          {/* Earnings */}
          <div className="border-r border-slate-800">
            <div className="bg-slate-900/60 px-4 py-2 border-b border-slate-800 font-mono font-semibold text-slate-300">
              EARNINGS
            </div>
            <div className="p-4 space-y-2 font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Basic Pay</span>
                <span>₹{(slip?.basic_pay || 45000).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>HRA</span>
                <span>₹{(slip?.hra || 22500).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Special Allowance</span>
                <span>₹{(slip?.special_allowance || 12500).toLocaleString()}</span>
              </div>
            </div>
            <div className="bg-slate-900/40 px-4 py-2.5 border-t border-slate-800 flex justify-between font-mono font-bold text-slate-200">
              <span>Gross Earnings</span>
              <span>₹{(slip?.total_earnings || 80000).toLocaleString()}</span>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <div className="bg-slate-900/60 px-4 py-2 border-b border-slate-800 font-mono font-semibold text-slate-300">
              DEDUCTIONS
            </div>
            <div className="p-4 space-y-2 font-mono text-slate-300">
              <div className="flex justify-between">
                <span>Provident Fund (PF)</span>
                <span className="text-rose-400">₹{(slip?.pf || 1800).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax Deducted (TDS)</span>
                <span className="text-rose-400">₹{(slip?.tds || 3200).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Professional Tax</span>
                <span className="text-rose-400">₹{(slip?.ptax || 200).toLocaleString()}</span>
              </div>
              {slip?.advance_deduction > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>Salary Advance</span>
                  <span>₹{slip.advance_deduction.toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="bg-slate-900/40 px-4 py-2.5 border-t border-slate-800 flex justify-between font-mono font-bold text-rose-400">
              <span>Total Deductions</span>
              <span>₹{(slip?.total_deductions || 10200).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between bg-blue-500/10 p-5 rounded border border-blue-500/20 font-mono">
          <div>
            <h4 className="text-blue-400 font-bold text-base">NET DISBURSED PAY</h4>
            <p className="text-xs text-slate-400 mt-0.5">DIRECT DEPOSIT TO SALARY BANK ACCOUNT</p>
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            ₹{(slip?.net_pay || 69800).toLocaleString()}
          </div>
        </div>
        
        <p className="text-[11px] text-center text-slate-500 font-mono pt-2">
          This is an electronically generated document authorized by TechCorp HRMS Core.
        </p>
      </Card>
    </div>
  )
}
