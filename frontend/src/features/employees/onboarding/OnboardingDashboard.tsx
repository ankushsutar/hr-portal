import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ChevronRight, CheckCircle2, CircleDashed, Users } from 'lucide-react'
import { Card } from '../../../components/ui/Card'

export const OnboardingDashboard = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['onboarding-instances'],
    queryFn: async () => {
      const res = await fetch('/api/v1/onboarding/instances', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to fetch instances')
      return res.json()
    }
  })

  if (isLoading) return <div className="p-8 font-mono text-xs text-slate-500">Loading onboarding workflows...</div>
  if (isError) return <div className="p-8 font-mono text-xs text-rose-400">Failed to load onboarding tracking data.</div>

  const instances = data?.data || []

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div>
        <h1 className="text-[28px] font-bold text-slate-100 leading-tight tracking-tight">Onboarding Tracker</h1>
        <p className="text-xs font-mono text-slate-400 mt-1">TRACK NEW HIRE TASK COMPLETION & STEPWISE PROVISIONING</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono">
        <Card className="p-4 bg-slate-900 border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Users size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 text-xs uppercase">Active Onboardings</h3>
              <div className="text-2xl font-bold text-slate-100 mt-0.5">
                {instances.filter((i: any) => i.status === 'IN_PROGRESS').length}
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-slate-900 border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 text-xs uppercase">Completed (Last 30 Days)</h3>
              <div className="text-2xl font-bold text-slate-100 mt-0.5">
                {instances.filter((i: any) => i.status === 'COMPLETED').length}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800 font-mono text-xs text-slate-400 uppercase">
                <th className="px-5 py-2.5">Employee</th>
                <th className="px-5 py-2.5">Template</th>
                <th className="px-5 py-2.5">Progress</th>
                <th className="px-5 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {instances.map((inst: any) => (
                <tr key={inst.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-slate-200 text-xs">{inst.employee_name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{inst.employee_id}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-300">{inst.template_name}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-full max-w-[140px] bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${inst.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                          style={{ width: `${inst.progress}%` }} 
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-200 w-8">{inst.progress}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      to="/onboarding/$instanceId"
                      params={{ instanceId: inst.id }}
                      className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-blue-400 rounded hover:bg-slate-800 transition-colors"
                    >
                      <ChevronRight size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {instances.length === 0 && (
            <div className="p-10 text-center font-mono text-xs text-slate-500">
              <CircleDashed className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              No active onboarding workflows found.
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
