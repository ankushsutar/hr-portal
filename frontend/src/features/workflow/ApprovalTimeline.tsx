import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, User, Clock } from 'lucide-react'

export const ApprovalTimeline = ({ instanceId }: { instanceId: string }) => {
  const { data, isLoading } = useQuery({ 
    queryKey: ['workflowHistory', instanceId], 
    queryFn: async () => {
      const token = localStorage.getItem('hrms_token') || localStorage.getItem('token')
      const res = await fetch(`/api/v1/workflows/instances/${instanceId}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    }
  })

  if (isLoading) return <div className="text-xs font-mono text-slate-500 py-4">Loading audit timeline...</div>

  return (
    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-800 font-mono text-xs">
      {data?.data?.map((item: any, idx: number) => (
        <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
          {/* Timeline marker */}
          <div className="flex items-center justify-center w-7 h-7 rounded-full border border-slate-700 bg-slate-900 text-blue-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
            {item.action === 'APPROVED' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : item.action === 'SUBMITTED' ? <User className="w-3.5 h-3.5 text-blue-400" /> : <Clock className="w-3.5 h-3.5 text-amber-400" />}
          </div>
          {/* Card */}
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#111827] p-3.5 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-bold text-slate-100 text-xs">{item.action}</h4>
              <time className="text-[10px] text-blue-400">{new Date(item.date).toLocaleDateString()}</time>
            </div>
            <div className="text-xs text-slate-300 mb-1">{item.user}</div>
            <p className="text-[11px] text-slate-400">{item.comments}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
