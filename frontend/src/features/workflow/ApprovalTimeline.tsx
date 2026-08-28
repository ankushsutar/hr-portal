import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, User, Clock } from 'lucide-react'

export const ApprovalTimeline = ({ instanceId }: { instanceId: string }) => {
  const { data, isLoading } = useQuery({ 
    queryKey: ['workflowHistory', instanceId], 
    queryFn: async () => {
      const res = await fetch(`http://localhost:8080/api/v1/workflows/instances/${instanceId}/history`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    }
  })

  if (isLoading) return <div className="text-sm text-gray-500 py-4">Loading timeline...</div>

  return (
    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
      {data?.data?.map((item: any, idx: number) => (
        <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          {/* Timeline marker */}
          <div className="flex items-center justify-center w-8 h-8 rounded-full border border-white bg-slate-200 text-slate-500 group-[.is-active]:bg-indigo-600 group-[.is-active]:text-indigo-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
            {item.action === 'APPROVED' ? <CheckCircle2 className="w-4 h-4" /> : item.action === 'SUBMITTED' ? <User className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
          </div>
          {/* Card */}
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-slate-900 text-sm">{item.action}</h4>
              <time className="text-xs font-medium text-indigo-500">{new Date(item.date).toLocaleDateString()}</time>
            </div>
            <div className="text-sm text-slate-600 mb-2 font-medium">{item.user}</div>
            <p className="text-xs text-slate-500">{item.comments}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
