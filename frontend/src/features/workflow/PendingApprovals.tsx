import { useQuery } from '@tanstack/react-query'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

const fetchPendingTasks = async () => {
  const res = await fetch('http://localhost:8080/api/v1/workflows/tasks/pending')
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export const PendingApprovals = () => {
  const { data, isLoading } = useQuery({ queryKey: ['pendingTasks'], queryFn: fetchPendingTasks })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Inbox</h2>
        <p className="text-gray-500 mt-1">Review and action your pending approvals.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading your inbox...</div>
        ) : data?.data?.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <CheckCircle className="w-12 h-12 text-green-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
            <p className="text-gray-500">You have no pending approvals in your inbox.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {data?.data?.map((task: any) => (
              <li key={task.task_id} className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between gap-6">
                <div className="flex items-start gap-4 flex-1">
                  <div className="bg-orange-100 text-orange-600 p-2 rounded-lg mt-1">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-gray-900">{task.entity_type}</h4>
                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600 border border-gray-200">
                        {task.module}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Requested by <span className="font-medium text-gray-900">{task.requester_name}</span> on {task.requested_date}
                    </p>
                    <p className="text-xs text-gray-500 mt-2 font-mono">Task ID: {task.task_id}</p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 shrink-0">
                  <button className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-red-600 border border-red-200 rounded-md text-sm font-medium hover:bg-red-50 transition-colors">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
