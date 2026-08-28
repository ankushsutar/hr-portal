import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Download, Printer } from 'lucide-react'

export const PayslipView = ({ id, onBack }: { id: string, onBack: () => void }) => {
  const { data, isLoading } = useQuery({ 
    queryKey: ['payslipDetails', id], 
    queryFn: async () => {
      const res = await fetch(`http://localhost:8080/api/v1/payroll/payslips/${id}`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    }
  })

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading payslip...</div>

  const slip = data?.data

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>

      <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-200">
        <div className="text-center border-b border-gray-200 pb-8 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">TechCorp Solutions Pvt. Ltd.</h1>
          <p className="text-gray-500 mt-1">Payslip for the month of {slip?.month} {slip?.year}</p>
        </div>

        <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-10 text-sm">
          <div>
            <p className="text-gray-500 mb-1">Employee Name</p>
            <p className="font-semibold text-gray-900">{slip?.employee_name}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Designation</p>
            <p className="font-semibold text-gray-900">{slip?.designation}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">PAN Number</p>
            <p className="font-medium text-gray-900 uppercase">ABCDE1234F</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">UAN Number</p>
            <p className="font-medium text-gray-900">100908070605</p>
          </div>
        </div>

        <div className="grid grid-cols-2 border border-gray-200 rounded-lg overflow-hidden">
          {/* Earnings */}
          <div className="border-r border-gray-200">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 font-semibold text-gray-700">Earnings</div>
            <div className="p-6 space-y-4">
              {slip?.earnings?.map((e: any, idx: number) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-600">{e.name}</span>
                  <span className="font-mono text-gray-900">₹{e.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between font-bold text-gray-900">
              <span>Total Earnings</span>
              <span className="font-mono">₹{slip?.total_earnings?.toLocaleString()}</span>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 font-semibold text-gray-700">Deductions</div>
            <div className="p-6 space-y-4">
              {slip?.deductions?.map((d: any, idx: number) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-600">{d.name}</span>
                  <span className="font-mono text-gray-900">₹{d.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between font-bold text-gray-900">
              <span>Total Deductions</span>
              <span className="font-mono">₹{slip?.total_deductions?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between bg-indigo-50 p-6 rounded-lg border border-indigo-100">
          <div>
            <h4 className="text-indigo-900 font-bold text-lg">Net Pay</h4>
            <p className="text-sm text-indigo-700 mt-1">Amount transferred to bank account</p>
          </div>
          <div className="text-3xl font-bold font-mono text-indigo-700">
            ₹{slip?.net_pay?.toLocaleString()}
          </div>
        </div>
        
        <p className="text-xs text-center text-gray-400 mt-8">This is a system generated payslip and does not require a signature.</p>
      </div>
    </div>
  )
}
