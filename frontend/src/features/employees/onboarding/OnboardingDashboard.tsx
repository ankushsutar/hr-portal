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

  if (isLoading) return <div className="p-8 font-mono text-xs text-[var(--text-muted)]">Loading onboarding workflows...</div>
  if (isError) return <div className="p-8 font-mono text-xs text-rose-500">Failed to load onboarding tracking data.</div>

  const instances = data?.data || []

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div>
        <h1 className="text-[28px] font-bold text-[var(--text-main)] leading-tight tracking-tight">Onboarding Tracker</h1>
        <p className="text-xs font-mono text-[var(--text-muted)] mt-1">TRACK NEW HIRE TASK COMPLETION & STEPWISE PROVISIONING</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono">
        <Card className="p-4 bg-[var(--bg-card)] border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--color-primary)]/10 rounded border border-[var(--color-primary)]/20 flex items-center justify-center theme-accent-text">
              <Users size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-main)] text-xs uppercase">Active Onboardings</h3>
              <div className="text-2xl font-bold text-[var(--text-main)] mt-0.5">
                {instances.filter((i: any) => i.status === 'IN_PROGRESS').length}
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-[var(--bg-card)] border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-main)] text-xs uppercase">Completed (Last 30 Days)</h3>
              <div className="text-2xl font-bold text-[var(--text-main)] mt-0.5">
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
              <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border-color)] font-mono text-xs text-[var(--text-muted)] uppercase">
                <th className="px-5 py-2.5">Employee</th>
                <th className="px-5 py-2.5">Template</th>
                <th className="px-5 py-2.5">Progress</th>
                <th className="px-5 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] font-mono text-xs text-[var(--text-main)]">
              {instances.map((inst: any) => (
                <tr key={inst.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-[var(--text-main)] text-xs">{inst.employee_name}</div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{inst.employee_id}</div>
                  </td>
                  <td className="px-5 py-3 text-[var(--text-main)]">{inst.template_name}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-full max-w-[140px] bg-[var(--bg-subtle)] rounded-full h-1.5 overflow-hidden border border-[var(--border-color)]">
                        <div 
                          className={`h-full rounded-full transition-all ${inst.progress === 100 ? 'bg-emerald-500' : 'theme-accent-bg'}`} 
                          style={{ width: `${inst.progress}%` }} 
                        />
                      </div>
                      <span className="text-xs font-bold text-[var(--text-main)] w-8">{inst.progress}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      to="/onboarding/$instanceId"
                      params={{ instanceId: inst.id }}
                      className="inline-flex items-center justify-center p-1.5 text-[var(--text-muted)] hover:text-[var(--color-primary)] rounded hover:bg-[var(--bg-subtle)] transition-colors"
                    >
                      <ChevronRight size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {instances.length === 0 && (
            <div className="p-10 text-center font-mono text-xs text-[var(--text-muted)]">
              <CircleDashed className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
              No active onboarding workflows found.
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
