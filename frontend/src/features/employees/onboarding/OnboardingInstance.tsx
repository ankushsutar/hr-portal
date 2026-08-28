import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from '@tanstack/react-router'
import { ArrowLeft, CheckCircle2, Circle, Clock, User } from 'lucide-react'
import { Card } from '../../../components/ui/Card'

export const OnboardingInstance = () => {
  const { instanceId } = useParams({ strict: false })
  const qc = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['onboarding-instance', instanceId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/onboarding/instances/${instanceId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to fetch instance')
      return res.json()
    },
    enabled: !!instanceId
  })

  const completeTask = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/v1/onboarding/instances/${instanceId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!res.ok) throw new Error('Failed to complete task')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding-instance', instanceId] })
      qc.invalidateQueries({ queryKey: ['onboarding-instances'] })
    }
  })

  if (isLoading) return <div className="p-8 font-mono text-xs text-slate-500">Loading onboarding checklist...</div>
  if (isError) return <div className="p-8 font-mono text-xs text-rose-400">Failed to load onboarding checklist.</div>

  const instance = data?.data
  if (!instance) return null

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <Link to="/onboarding" className="inline-flex items-center text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors mb-2">
        <ArrowLeft size={14} className="mr-1.5" /> Back to Dashboard
      </Link>

      <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 text-slate-100 font-mono">
        <div className="flex items-center justify-between mb-4">
          <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase rounded">
            {instance.template_name}
          </span>
          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
            instance.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
          }`}>
            {instance.status.replace('_', ' ')}
          </span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight font-sans mb-1">{instance.employee_name}</h1>
            <p className="text-slate-400 text-xs flex items-center gap-1.5"><User size={14}/> {instance.employee_id}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-slate-100">{instance.progress}%</div>
            <div className="text-[10px] text-slate-400 uppercase">Completion Rate</div>
          </div>
        </div>
        <div className="mt-4 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div className={`h-full transition-all duration-500 ${instance.progress === 100 ? 'bg-emerald-400' : 'bg-blue-500'}`} style={{ width: `${instance.progress}%` }} />
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60 font-mono text-xs flex items-center justify-between">
          <h3 className="font-semibold text-slate-100">Stepwise Task Checklist</h3>
          <span className="text-slate-400">{instance.tasks?.length || 0} TASKS</span>
        </div>
        <div className="divide-y divide-slate-800/60 font-mono text-xs">
          {instance.tasks?.map((task: any) => (
            <div key={task.id} className={`p-4 flex items-start gap-3 transition-colors ${task.status === 'COMPLETED' ? 'bg-slate-900/20' : 'hover:bg-slate-800/30'}`}>
              <button
                disabled={task.status === 'COMPLETED' || completeTask.isPending}
                onClick={() => completeTask.mutate(task.id)}
                className={`mt-0.5 shrink-0 transition-colors ${task.status === 'COMPLETED' ? 'text-emerald-400' : 'text-slate-600 hover:text-blue-400 cursor-pointer disabled:opacity-50'}`}
              >
                {task.status === 'COMPLETED' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
              </button>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`font-semibold ${task.status === 'COMPLETED' ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                    {task.task_name}
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                    {task.owner_role.replace('_', ' ')}
                  </span>
                </div>
                {task.description && (
                  <p className="text-slate-400 text-xs mb-2 leading-relaxed">{task.description}</p>
                )}
                {task.status === 'COMPLETED' && (
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 w-fit px-2 py-0.5 rounded">
                    <CheckCircle2 size={12} />
                    Completed {task.completed_at ? `on ${task.completed_at}` : ''}
                  </div>
                )}
                {task.status === 'PENDING' && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Clock size={13} /> Pending action
                  </div>
                )}
              </div>
            </div>
          ))}
          {(!instance.tasks || instance.tasks.length === 0) && (
            <div className="p-10 text-center font-mono text-xs text-slate-500">
              No tasks configured for this onboarding template.
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
