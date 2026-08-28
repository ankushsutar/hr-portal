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

  if (isLoading) return <div className="p-8 font-mono text-xs text-slate-500">Loading offboarding dashboard...</div>
  const exits = data?.data || []

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div>
        <h1 className="text-[28px] font-bold text-slate-100 leading-tight tracking-tight">Employee Offboarding</h1>
        <p className="text-xs font-mono text-slate-400 mt-1">MANAGE RESIGNATIONS & TRACK SEPARATION CLEARANCES</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
        <Card className="p-4 bg-gradient-to-br from-blue-950/30 to-slate-900 border-blue-500/20 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Pending Review</p>
            <h2 className="text-3xl font-bold text-slate-100 mt-1">
              {exits.filter((e: any) => e.status === 'PENDING').length}
            </h2>
          </div>
          <div className="w-10 h-10 bg-blue-500/10 rounded border border-blue-500/20 flex items-center justify-center text-blue-400">
            <AlertCircle size={20} />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-950/30 to-slate-900 border-amber-500/20 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">In Notice Period</p>
            <h2 className="text-3xl font-bold text-slate-100 mt-1">
              {exits.filter((e: any) => e.status === 'APPROVED').length}
            </h2>
          </div>
          <div className="w-10 h-10 bg-amber-500/10 rounded border border-amber-500/20 flex items-center justify-center text-amber-400">
            <UserMinus size={20} />
          </div>
        </Card>

        <Card className="p-4 bg-slate-900 border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recently Exited</p>
            <h2 className="text-3xl font-bold text-slate-100 mt-1">0</h2>
          </div>
          <div className="w-10 h-10 bg-slate-800 rounded border border-slate-700 flex items-center justify-center text-slate-400">
            <CheckCircle2 size={20} />
          </div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60 font-mono text-xs flex items-center justify-between">
          <h3 className="font-semibold text-slate-100">Active Exit Workflows</h3>
          <span className="text-slate-400">{exits.length} REQUESTS</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40 font-mono text-xs text-slate-400 uppercase">
                <th className="px-5 py-2.5">Employee</th>
                <th className="px-5 py-2.5">Resignation Date</th>
                <th className="px-5 py-2.5">Last Working Day</th>
                <th className="px-5 py-2.5">Status</th>
                <th className="px-5 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {exits.map((ex: any) => (
                <tr key={ex.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-blue-400 text-xs">
                        {ex.employee_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200">{ex.employee_name}</div>
                        <div className="text-[11px] text-slate-400">{ex.department}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-500"/> {ex.resignation_date}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-300 font-bold">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-500"/> {ex.last_working_date}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      ex.status === 'PENDING' 
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {ex.status === 'APPROVED' ? 'IN NOTICE' : ex.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {ex.status === 'PENDING' ? (
                      <button 
                        onClick={() => approveMutation.mutate(ex.id)}
                        disabled={approveMutation.isPending}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                      >
                        {approveMutation.isPending && <Loader2 size={12} className="animate-spin" />} Approve Clearance
                      </button>
                    ) : (
                      <Link to="/employees/$employeeId" params={{ employeeId: ex.employee_id }} className="text-xs font-mono text-slate-300 hover:text-white inline-flex items-center gap-1">
                        View Clearance <ArrowRight size={13}/>
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {exits.length === 0 && (
            <div className="p-10 text-center font-mono text-xs text-slate-500">No active resignations recorded.</div>
          )}
        </div>
      </Card>
    </div>
  )
}
