import { useQuery } from '@tanstack/react-query'
import { FileText, Download, Eye, TrendingUp, IndianRupee } from 'lucide-react'
import { useState } from 'react'
import { PayslipView } from './PayslipView'

const fetchPayslips = async () => {
  const res = await fetch('http://localhost:8080/api/v1/payroll/payslips')
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export const PayrollDashboard = () => {
  const [selectedPayslipId, setSelectedPayslipId] = useState<string | null>(null)
  const { data, isLoading } = useQuery({ queryKey: ['payslips'], queryFn: fetchPayslips })

  if (selectedPayslipId) {
    return <PayslipView id={selectedPayslipId} onBack={() => setSelectedPayslipId(null)} />
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center border-b border-gray-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payroll & Compensation</h2>
          <p className="text-gray-500 mt-1">View your payslips and YTD earnings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 text-gray-600 font-medium mb-3">
            <IndianRupee className="w-5 h-5 text-indigo-500" /> Latest Net Pay
          </div>
          <div className="text-4xl font-bold text-gray-900">₹75,000</div>
          <p className="text-xs text-gray-500 mt-2">August 2026</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm md:col-span-2">
          <div className="flex items-center gap-3 text-gray-600 font-medium mb-3">
            <TrendingUp className="w-5 h-5 text-green-500" /> YTD Earnings (FY 26-27)
          </div>
          <div className="flex items-end gap-4 mt-2">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Gross</p>
              <div className="text-2xl font-bold text-gray-900">₹4,00,000</div>
            </div>
            <div className="h-10 w-px bg-gray-200"></div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Deductions</p>
              <div className="text-2xl font-bold text-gray-900 text-red-500">₹25,000</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Payslips</h3>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading payslips...</div>
          ) : data?.data?.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No payslips found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">Month / Year</th>
                    <th className="px-6 py-4">Gross Pay</th>
                    <th className="px-6 py-4">Deductions</th>
                    <th className="px-6 py-4">Net Pay</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data?.map((slip: any) => (
                    <tr key={slip.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-500" />
                          {slip.month} {slip.year}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono">₹{slip.total_earnings.toLocaleString()}</td>
                      <td className="px-6 py-4 font-mono text-red-500">₹{slip.total_deductions.toLocaleString()}</td>
                      <td className="px-6 py-4 font-mono font-semibold text-gray-900">₹{slip.net_pay.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          slip.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {slip.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button 
                            onClick={() => setSelectedPayslipId(slip.id)}
                            className="text-indigo-600 hover:text-indigo-900 font-medium text-sm flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" /> View
                          </button>
                          <button className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
