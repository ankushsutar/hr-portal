import { useQuery } from '@tanstack/react-query'
import { Plus, Calendar, CheckCircle, Settings, Users } from 'lucide-react'
import { useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { LeaveApplicationForm } from './LeaveApplicationForm'
import { Card } from '../../components/ui/Card'

export const LeaveDashboard = () => {
  const [isApplyOpen, setIsApplyOpen] = useState(false)
  
  const { data: balancesData, isLoading: balancesLoading } = useQuery({ 
    queryKey: ['leaveBalances'], 
    queryFn: async () => {
      const res = await fetch('/api/v1/leave/balances', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    }
  })

  const { data: appsData, isLoading: appsLoading } = useQuery({ 
    queryKey: ['leaveApplications'], 
    queryFn: async () => {
      const res = await fetch('/api/v1/leave/applications', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    }
  })

  const { data: typesData, isLoading: typesLoading } = useQuery({
    queryKey: ['leaveTypes'],
    queryFn: async () => {
      const res = await fetch('/api/v1/leave/types', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    }
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in p-8">
      <div className="flex justify-between items-center pb-2">
        <div>
          <h1 className="text-[30px] font-bold text-gray-900 leading-[36px] tracking-tight">Leave Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage balances, requests, and leave policies.</p>
        </div>
        <button 
          onClick={() => setIsApplyOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" /> Request Leave
        </button>
      </div>

      <Tabs.Root defaultValue="my-leaves" className="w-full">
        <Tabs.List className="flex border-b border-gray-200 mb-6">
          <Tabs.Trigger value="my-leaves" className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 transition-colors flex items-center gap-2">
            <Calendar className="w-4 h-4" /> My Leaves
          </Tabs.Trigger>
          <Tabs.Trigger value="team-calendar" className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 transition-colors flex items-center gap-2">
            <Users className="w-4 h-4" /> Team Calendar
          </Tabs.Trigger>
          <Tabs.Trigger value="settings" className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 transition-colors flex items-center gap-2">
            <Settings className="w-4 h-4" /> Policies
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="my-leaves" className="space-y-8 focus:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {balancesLoading ? (
              <div className="text-gray-500 col-span-3">Loading balances...</div>
            ) : (
              balancesData?.data?.map((b: any) => (
                <div key={b.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                  <h4 className="text-gray-600 font-medium mb-4 uppercase text-xs tracking-wider">{b.leave_type}</h4>
                  <div className="flex items-end gap-2">
                    <span className="text-[32px] font-bold text-gray-900 leading-none">{b.balance}</span>
                    <span className="text-sm font-medium text-gray-500 mb-1">days remaining</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-500 font-medium">
                    <span>Accrued: {b.total_accrued}</span>
                    <span>Used: {b.total_used}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <Card className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-semibold text-gray-900">Recent Applications</h3>
            </div>
            {appsLoading ? (
              <div className="p-8 text-center text-gray-500">Loading applications...</div>
            ) : appsData?.data?.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No leave applications found.</div>
            ) : (
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50/20 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs">Leave Type</th>
                    <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs">Dates</th>
                    <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs">Days</th>
                    <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs">Applied On</th>
                    <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {appsData?.data?.map((app: any) => (
                    <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{app.leave_type}</td>
                      <td className="px-6 py-4">{app.start_date} to {app.end_date}</td>
                      <td className="px-6 py-4">{app.total_days}</td>
                      <td className="px-6 py-4 text-gray-500">{app.applied_on}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          app.status === 'APPROVED' ? 'bg-green-50 text-green-700' :
                          app.status === 'PENDING' ? 'bg-amber-50 text-amber-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </Tabs.Content>

        <Tabs.Content value="team-calendar" className="focus:outline-none">
          <Card className="p-12 text-center flex flex-col items-center justify-center bg-gray-50/50 border border-gray-200 border-dashed">
            <Calendar className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Team Calendar Integration</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-sm">
              Visual calendar mapping of all approved leaves in your department will appear here.
            </p>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="settings" className="focus:outline-none">
          <Card className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Leave Policies (Rules Engine)</h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">Add Policy</button>
            </div>
            
            {typesLoading ? (
              <div className="p-8 text-center text-gray-500">Loading configurations...</div>
            ) : (
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50/20 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs">Policy Name</th>
                    <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs text-center">Accrual</th>
                    <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs text-center">Carry Fwd</th>
                    <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs text-center">Sandwich</th>
                    <th className="px-6 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs text-center">Encashable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {typesData?.data?.map((type: any) => (
                    <tr key={type.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{type.name} <span className="text-gray-400 font-normal">({type.code})</span></div>
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-xs">{type.accrual_days}/<span className="text-gray-400">{type.accrual_frequency.substring(0,2)}</span></td>
                      <td className="px-6 py-4 text-center font-mono text-xs">{type.max_carry_forward}</td>
                      <td className="px-6 py-4 text-center">
                        {type.sandwich_rule ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto"/> : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {type.encashable ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto"/> : <span className="text-gray-300">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </Tabs.Content>
      </Tabs.Root>

      {isApplyOpen && <LeaveApplicationForm onClose={() => setIsApplyOpen(false)} />}
    </div>
  )
}
