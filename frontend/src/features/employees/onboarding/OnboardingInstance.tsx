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

  if (isLoading) return <div className="p-8 text-gray-500">Loading checklist...</div>
  if (isError) return <div className="p-8 text-red-500">Failed to load checklist.</div>

  const instance = data?.data
  if (!instance) return null

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <Link to="/onboarding" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-4">
        <ArrowLeft size={16} className="mr-1.5" /> Back to Dashboard
      </Link>

      <Card className="p-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-12 -mt-12" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium uppercase tracking-wide text-white/80">
              {instance.template_name}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${instance.status === 'COMPLETED' ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'}`}>
              {instance.status.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{instance.employee_name}</h1>
              <p className="text-gray-400 flex items-center gap-2"><User size={16}/> {instance.employee_id}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold tracking-tight mb-1">{instance.progress}%</div>
              <div className="text-xs text-gray-400 font-medium uppercase">Completion</div>
            </div>
          </div>
          <div className="mt-8 w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div className={`h-full transition-all duration-1000 ${instance.progress === 100 ? 'bg-green-400' : 'bg-blue-500'}`} style={{ width: `${instance.progress}%` }} />
          </div>
        </div>
      </Card>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Task Checklist</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {instance.tasks?.map((task: any) => (
            <div key={task.id} className={`p-6 flex items-start gap-4 transition-colors ${task.status === 'COMPLETED' ? 'bg-gray-50/30' : 'hover:bg-gray-50/50'}`}>
              <button
                disabled={task.status === 'COMPLETED' || completeTask.isPending}
                onClick={() => completeTask.mutate(task.id)}
                className={`mt-0.5 shrink-0 transition-colors ${task.status === 'COMPLETED' ? 'text-green-500' : 'text-gray-300 hover:text-blue-500 cursor-pointer disabled:opacity-50'}`}
              >
                {task.status === 'COMPLETED' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </button>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`font-medium ${task.status === 'COMPLETED' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {task.task_name}
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-gray-100 text-gray-600">
                    {task.owner_role.replace('_', ' ')}
                  </span>
                </div>
                {task.description && (
                  <p className="text-sm text-gray-500 mb-3">{task.description}</p>
                )}
                {task.status === 'COMPLETED' && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 w-fit px-2 py-1 rounded">
                    <CheckCircle2 size={12} />
                    Completed {task.completed_at ? `on ${task.completed_at}` : ''}
                  </div>
                )}
                {task.status === 'PENDING' && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock size={14} /> Pending action
                  </div>
                )}
              </div>
            </div>
          ))}
          {(!instance.tasks || instance.tasks.length === 0) && (
            <div className="p-12 text-center text-gray-500">
              No tasks configured for this onboarding template.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
