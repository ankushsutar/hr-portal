import { useQuery } from '@tanstack/react-query'
import { Plus, Calendar, CheckCircle, Clock } from 'lucide-react'
import { useState } from 'react'
import { LeaveApplicationForm } from './LeaveApplicationForm'

const fetchBalances = async () => {
  const res = await fetch('http://localhost:8080/api/v1/leave/balances')
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

const fetchApplications = async () => {
  const res = await fetch('http://localhost:8080/api/v1/leave/applications')
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export const LeaveDashboard = () => {
  const [isApplyOpen, setIsApplyOpen] = useState(false)
  const { data: balancesData, isLoading: balancesLoading } = useQuery({ queryKey: ['leaveBalances'], queryFn: fetchBalances })
  const { data: appsData, isLoading: appsLoading } = useQuery({ queryKey: ['leaveApplications'], queryFn: fetchApplications })

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center border-b border-gray-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leave Management</h2>
          <p className="text-gray-500 mt-1">View your balances and apply for time off.</p>
        </div>
        <button 
          onClick={() => setIsApplyOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold shadow-sm"
        >
          <Plus className="w-4 h-4" /> Apply Leave
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-500" /> Leave Balances (2026)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {balancesLoading ? (
            <div className="text-gray-500 col-span-3">Loading balances...</div>
          ) : (
            balancesData?.data?.map((b: any) => (
              <div key={b.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-colors">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l-xl"></div>
                <h4 className="text-gray-600 font-medium mb-4">{b.leave_type}</h4>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-gray-900">{b.balance}</span>
                  <span className="text-sm font-medium text-gray-500 mb-1">days remaining</span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                  <span>Accrued: {b.total_accrued}</span>
                  <span>Used: {b.total_used}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Recent Applications</h3>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {appsLoading ? (
            <div className="p-8 text-center text-gray-500">Loading applications...</div>
          ) : appsData?.data?.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No leave applications found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-4">Leave Type</th>
                    <th className="px-6 py-4">Dates</th>
                    <th className="px-6 py-4">Days</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Applied On</th>
                  </tr>
                </thead>
                <tbody>
                  {appsData?.data?.map((app: any) => (
                    <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{app.leave_type}</td>
                      <td className="px-6 py-4">{app.start_date} to {app.end_date}</td>
                      <td className="px-6 py-4">{app.total_days}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full flex w-fit items-center gap-1 ${
                          app.status === 'APPROVED' ? 'bg-green-100 text-green-800 border-green-200' :
                          app.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          'bg-red-100 text-red-800 border-red-200'
                        } border`}>
                          {app.status === 'APPROVED' ? <CheckCircle className="w-3 h-3"/> : <Clock className="w-3 h-3"/>}
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{app.applied_on}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isApplyOpen && <LeaveApplicationForm onClose={() => setIsApplyOpen(false)} />}
    </div>
  )
}
