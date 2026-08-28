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

  if (isLoading) return <div className="p-8 text-gray-500">Loading dashboard...</div>
  if (isError) return <div className="p-8 text-red-500">Failed to load dashboard.</div>

  const instances = data?.data || []

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Onboarding Tracking</h1>
        <p className="text-gray-500 mt-1">Track task completion for new hires across all departments.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 bg-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 text-blue-600 mb-4">
            <Users size={24} />
            <h3 className="font-semibold text-gray-900">Active Onboardings</h3>
          </div>
          <div className="text-4xl font-bold text-gray-900">{instances.filter((i: any) => i.status === 'IN_PROGRESS').length}</div>
        </Card>
        
        <Card className="p-6 bg-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 text-green-600 mb-4">
            <CheckCircle2 size={24} />
            <h3 className="font-semibold text-gray-900">Completed (Last 30 Days)</h3>
          </div>
          <div className="text-4xl font-bold text-gray-900">{instances.filter((i: any) => i.status === 'COMPLETED').length}</div>
        </Card>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-8">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/60 border-b border-gray-100">
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Template</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Progress</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {instances.map((inst: any) => (
              <tr key={inst.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900 text-sm">{inst.employee_name}</div>
                  <div className="text-xs text-gray-500 font-mono mt-0.5">{inst.employee_id}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{inst.template_name}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-full max-w-[150px] bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${inst.progress === 100 ? 'bg-green-500' : 'bg-blue-600'}`} 
                        style={{ width: `${inst.progress}%` }} 
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-8">{inst.progress}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    to="/onboarding/$instanceId"
                    params={{ instanceId: inst.id }}
                    className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    <ChevronRight size={18} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {instances.length === 0 && (
          <div className="p-12 text-center">
            <CircleDashed className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-medium">No active onboardings found</p>
          </div>
        )}
      </div>
    </div>
  )
}
