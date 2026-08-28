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
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-slate-100 leading-tight tracking-tight">Leave Engine Console</h1>
          <p className="text-xs font-mono text-slate-400 mt-1">LEAVE BALANCES, APPLICATION REQUESTS & POLICY RULES</p>
        </div>
        <button 
          onClick={() => setIsApplyOpen(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded text-xs font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Request Leave
        </button>
      </div>

      <Tabs.Root defaultValue="my-leaves" className="w-full">
        <Tabs.List className="flex border-b border-slate-800 mb-6 gap-2">
          <Tabs.Trigger 
            value="my-leaves" 
            className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 transition-colors flex items-center gap-1.5 font-mono"
          >
            <Calendar className="w-3.5 h-3.5" /> MY BALANCES
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="team-calendar" 
            className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 transition-colors flex items-center gap-1.5 font-mono"
          >
            <Users className="w-3.5 h-3.5" /> TEAM CALENDAR
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="settings" 
            className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 transition-colors flex items-center gap-1.5 font-mono"
          >
            <Settings className="w-3.5 h-3.5" /> POLICY RULES
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="my-leaves" className="space-y-6 focus:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {balancesLoading ? (
              <div className="text-slate-500 font-mono text-xs col-span-3">Loading balances...</div>
            ) : (
              balancesData?.data?.map((b: any) => (
                <Card key={b.id} className="p-5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                  <h4 className="text-xs font-mono text-slate-400 mb-3 uppercase tracking-wider">{b.leave_type}</h4>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-mono font-bold text-slate-100 leading-none">{b.balance}</span>
                    <span className="text-xs text-slate-400 mb-0.5 font-mono">days remaining</span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between text-[11px] font-mono text-slate-400">
                    <span>Accrued: {b.total_accrued}</span>
                    <span>Used: {b.total_used}</span>
                  </div>
                </Card>
              ))
            )}
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60">
              <h3 className="font-semibold text-slate-100 text-sm">Recent Applications</h3>
            </div>
            {appsLoading ? (
              <div className="p-6 text-center text-slate-500 font-mono text-xs">Loading applications...</div>
            ) : appsData?.data?.length === 0 ? (
              <div className="p-6 text-center text-slate-500 font-mono text-xs">No leave applications found.</div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40">
                    <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase">Leave Type</th>
                    <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase">Dates</th>
                    <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase">Days</th>
                    <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase">Applied On</th>
                    <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {appsData?.data?.map((app: any) => (
                    <tr key={app.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3 font-semibold text-slate-200">{app.leave_type}</td>
                      <td className="px-5 py-3 font-mono text-slate-300">{app.start_date} to {app.end_date}</td>
                      <td className="px-5 py-3 font-mono text-blue-400 font-bold">{app.total_days}</td>
                      <td className="px-5 py-3 font-mono text-slate-500">{app.applied_on}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono uppercase ${
                          app.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          app.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-rose-500/10 text-rose-400 border border-rose-500/20'
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
          <Card className="p-12 text-center flex flex-col items-center justify-center border-dashed border-slate-800 bg-[#111827]/40">
            <Calendar className="w-10 h-10 text-slate-600 mb-3" />
            <h3 className="text-sm font-semibold text-slate-200">Team Calendar Integration</h3>
            <p className="text-xs text-slate-500 font-mono mt-1 max-w-sm">
              Visual department calendar feed of active & scheduled leaves.
            </p>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="settings" className="focus:outline-none">
          <Card className="p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60 flex justify-between items-center">
              <h3 className="font-semibold text-slate-100 text-sm">Configured Leave Policies</h3>
              <button className="text-blue-400 hover:text-blue-300 text-xs font-mono">Add Policy</button>
            </div>
            
            {typesLoading ? (
              <div className="p-6 text-center text-slate-500 font-mono text-xs">Loading configurations...</div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40">
                    <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase">Policy Name</th>
                    <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase text-center">Accrual Rate</th>
                    <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase text-center">Max Carry Fwd</th>
                    <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase text-center">Sandwich Rule</th>
                    <th className="px-5 py-2.5 text-xs font-mono text-slate-400 uppercase text-center">Encashable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {typesData?.data?.map((type: any) => (
                    <tr key={type.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-200">{type.name} <span className="text-slate-500 font-mono">({type.code})</span></div>
                      </td>
                      <td className="px-5 py-3 text-center font-mono text-blue-300">{type.accrual_days}/<span className="text-slate-500">{type.accrual_frequency.substring(0,2)}</span></td>
                      <td className="px-5 py-3 text-center font-mono text-slate-300">{type.max_carry_forward}</td>
                      <td className="px-5 py-3 text-center">
                        {type.sandwich_rule ? <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto"/> : <span className="text-slate-600 font-mono">-</span>}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {type.encashable ? <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto"/> : <span className="text-slate-600 font-mono">-</span>}
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
