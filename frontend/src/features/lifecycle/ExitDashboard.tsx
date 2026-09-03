import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Card } from '../../components/ui/Card'
import { UserMinus, CheckCircle2, AlertCircle, Calendar, ArrowRight, Loader2 } from 'lucide-react'

export const ExitDashboard = () => {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['exits'],
    queryFn: async () => {
      const res = await fetch('/api/v1/lifecycle/exits', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to fetch exits')
      return res.json()
    }
  })

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/lifecycle/exits/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to approve')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exits'] })
  })

  if (isLoading) return <div className="p-8 font-mono text-xs text-[var(--text-muted)]">Loading offboarding dashboard...</div>
  const exits = data?.data || []

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div>
        <h1 className="text-[28px] font-bold text-[var(--text-main)] leading-tight tracking-tight">Employee Offboarding</h1>
        <p className="text-xs font-mono text-[var(--text-muted)] mt-1">MANAGE RESIGNATIONS & TRACK SEPARATION CLEARANCES</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
        <Card className="p-4 bg-[var(--bg-card)] border-[var(--border-color)] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold theme-accent-text uppercase tracking-wider">Pending Review</p>
            <h2 className="text-3xl font-bold text-[var(--text-main)] mt-1">
              {exits.filter((e: any) => e.status === 'PENDING').length}
            </h2>
          </div>
          <div className="w-10 h-10 bg-[var(--color-primary)]/10 rounded border border-[var(--color-primary)]/20 flex items-center justify-center theme-accent-text">
            <AlertCircle size={20} />
          </div>
        </Card>

        <Card className="p-4 bg-[var(--bg-card)] border-[var(--border-color)] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider">In Notice Period</p>
            <h2 className="text-3xl font-bold text-[var(--text-main)] mt-1">
              {exits.filter((e: any) => e.status === 'APPROVED').length}
            </h2>
          </div>
          <div className="w-10 h-10 bg-amber-500/10 rounded border border-amber-500/20 flex items-center justify-center text-amber-500">
            <UserMinus size={20} />
          </div>
        </Card>

        <Card className="p-4 bg-[var(--bg-card)] border-[var(--border-color)] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Recently Exited</p>
            <h2 className="text-3xl font-bold text-[var(--text-main)] mt-1">0</h2>
          </div>
          <div className="w-10 h-10 bg-[var(--bg-subtle)] rounded border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)]">
            <CheckCircle2 size={20} />
          </div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden bg-[var(--bg-card)] border-[var(--border-color)]">
        <div className="px-5 py-3 border-b border-[var(--border-color)] bg-[var(--bg-subtle)] font-mono text-xs flex items-center justify-between">
          <h3 className="font-semibold text-[var(--text-main)]">Active Exit Workflows</h3>
          <span className="text-[var(--text-muted)]">{exits.length} REQUESTS</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-subtle)]/60 font-mono text-xs text-[var(--text-muted)] uppercase">
                <th className="px-5 py-2.5">Employee</th>
                <th className="px-5 py-2.5">Resignation Date</th>
                <th className="px-5 py-2.5">Last Working Day</th>
                <th className="px-5 py-2.5">Status</th>
                <th className="px-5 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] font-mono text-xs text-[var(--text-main)]">
              {exits.map((ex: any) => (
                <tr key={ex.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded bg-[var(--bg-subtle)] border border-[var(--border-color)] flex items-center justify-center font-bold theme-accent-text text-xs">
                        {ex.employee_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-[var(--text-main)]">{ex.employee_name}</div>
                        <div className="text-[11px] text-[var(--text-muted)]">{ex.department}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[var(--text-main)]">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-[var(--text-muted)]"/> {ex.resignation_date}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[var(--text-main)] font-bold">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-[var(--text-muted)]"/> {ex.last_working_date}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      ex.status === 'PENDING' 
                        ? 'bg-[var(--color-primary)]/10 theme-accent-text border border-[var(--color-primary)]/20' 
                        : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    }`}>
                      {ex.status === 'APPROVED' ? 'IN NOTICE' : ex.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {ex.status === 'PENDING' ? (
                      <button 
                        onClick={() => approveMutation.mutate(ex.id)}
                        disabled={approveMutation.isPending}
                        className="px-3 py-1 theme-accent-bg hover:opacity-90 text-white rounded text-xs font-medium transition-colors disabled:opacity-50 inline-flex items-center gap-1 shadow-sm"
                      >
                        {approveMutation.isPending && <Loader2 size={12} className="animate-spin" />} Approve Clearance
                      </button>
                    ) : (
                      <Link to="/employees/$employeeId" params={{ employeeId: ex.employee_id }} className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] inline-flex items-center gap-1">
                        View Clearance <ArrowRight size={13}/>
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {exits.length === 0 && (
            <div className="p-10 text-center font-mono text-xs text-[var(--text-muted)]">No active resignations recorded.</div>
          )}
        </div>
      </Card>
    </div>
  )
}
