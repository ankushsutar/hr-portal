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

  if (isLoading) return <div className="p-8 font-mono text-xs text-[var(--text-muted)]">Loading onboarding checklist...</div>
  if (isError) return <div className="p-8 font-mono text-xs text-rose-500">Failed to load onboarding checklist.</div>

  const instance = data?.data
  if (!instance) return null

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <Link to="/onboarding" className="inline-flex items-center text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors mb-2">
        <ArrowLeft size={14} className="mr-1.5" /> Back to Dashboard
      </Link>

      <Card className="p-6 bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-main)] font-mono">
        <div className="flex items-center justify-between mb-4">
          <span className="px-2.5 py-0.5 bg-[var(--color-primary)]/10 theme-accent-text border border-[var(--color-primary)]/20 text-[10px] font-bold uppercase rounded">
            {instance.template_name}
          </span>
          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
            instance.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-[var(--color-primary)]/10 theme-accent-text border border-[var(--color-primary)]/20'
          }`}>
            {instance.status.replace('_', ' ')}
          </span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-main)] tracking-tight font-sans mb-1">{instance.employee_name}</h1>
            <p className="text-[var(--text-muted)] text-xs flex items-center gap-1.5"><User size={14}/> {instance.employee_id}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-[var(--text-main)]">{instance.progress}%</div>
            <div className="text-[10px] text-[var(--text-muted)] uppercase">Completion Rate</div>
          </div>
        </div>
        <div className="mt-4 w-full bg-[var(--bg-subtle)] rounded-full h-1.5 overflow-hidden border border-[var(--border-color)]">
          <div className={`h-full transition-all duration-500 ${instance.progress === 100 ? 'bg-emerald-500' : 'theme-accent-bg'}`} style={{ width: `${instance.progress}%` }} />
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--border-color)] bg-[var(--bg-subtle)] font-mono text-xs flex items-center justify-between">
          <h3 className="font-semibold text-[var(--text-main)]">Stepwise Task Checklist</h3>
          <span className="text-[var(--text-muted)]">{instance.tasks?.length || 0} TASKS</span>
        </div>
        <div className="divide-y divide-[var(--border-color)] font-mono text-xs">
          {instance.tasks?.map((task: any) => (
            <div key={task.id} className={`p-4 flex items-start gap-3 transition-colors ${task.status === 'COMPLETED' ? 'bg-[var(--bg-subtle)]/30' : 'hover:bg-[var(--bg-subtle)]'}`}>
              <button
                disabled={task.status === 'COMPLETED' || completeTask.isPending}
                onClick={() => completeTask.mutate(task.id)}
                className={`mt-0.5 shrink-0 transition-colors ${task.status === 'COMPLETED' ? 'text-emerald-500' : 'text-[var(--text-muted)] hover:text-[var(--color-primary)] cursor-pointer disabled:opacity-50'}`}
              >
                {task.status === 'COMPLETED' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
              </button>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`font-semibold ${task.status === 'COMPLETED' ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-main)]'}`}>
                    {task.task_name}
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-color)]">
                    {task.owner_role.replace('_', ' ')}
                  </span>
                </div>
                {task.description && (
                  <p className="text-[var(--text-muted)] text-xs mb-2 leading-relaxed">{task.description}</p>
                )}
                {task.status === 'COMPLETED' && (
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 w-fit px-2 py-0.5 rounded">
                    <CheckCircle2 size={12} />
                    Completed {task.completed_at ? `on ${task.completed_at}` : ''}
                  </div>
                )}
                {task.status === 'PENDING' && (
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                    <Clock size={13} /> Pending action
                  </div>
                )}
              </div>
            </div>
          ))}
          {(!instance.tasks || instance.tasks.length === 0) && (
            <div className="p-10 text-center font-mono text-xs text-[var(--text-muted)]">
              No tasks configured for this onboarding template.
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
