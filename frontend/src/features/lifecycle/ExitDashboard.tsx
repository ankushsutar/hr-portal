import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Card } from '../../components/ui/Card'
import { UserMinus, CheckCircle2, AlertCircle, Calendar, ArrowRight } from 'lucide-react'

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

  if (isLoading) return <div className="p-8 text-gray-500">Loading offboarding dashboard...</div>
  const exits = data?.data || []

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Offboarding</h1>
        <p className="text-gray-500 mt-1">Manage pending resignations and track employee clearance workflows.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 bg-blue-50/50 border border-blue-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">Pending Review</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">
              {exits.filter((e: any) => e.status === 'PENDING').length}
            </h2>
          </div>
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-500">
            <AlertCircle size={24} />
          </div>
        </Card>
        <Card className="p-6 bg-orange-50/50 border border-orange-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-orange-600 uppercase tracking-wide">In Notice Period</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">
              {exits.filter((e: any) => e.status === 'APPROVED').length}
            </h2>
          </div>
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-orange-500">
            <UserMinus size={24} />
          </div>
        </Card>
        <Card className="p-6 bg-gray-50/50 border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Recently Exited</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">0</h2>
          </div>
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400">
            <CheckCircle2 size={24} />
          </div>
        </Card>
      </div>

      <Card className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-semibold text-gray-900">Active Exit Workflows</h3>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/20">
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Employee</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Resignation Date</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Last Working Day</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {exits.map((ex: any) => (
              <tr key={ex.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                      {ex.employee_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{ex.employee_name}</div>
                      <div className="text-xs text-gray-500">{ex.department}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Calendar size={14}/> {ex.resignation_date}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                    <Calendar size={14}/> {ex.last_working_date}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                    ex.status === 'PENDING' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
                  }`}>
                    {ex.status === 'APPROVED' ? 'IN NOTICE' : ex.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {ex.status === 'PENDING' ? (
                    <button 
                      onClick={() => approveMutation.mutate(ex.id)}
                      disabled={approveMutation.isPending}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    >
                      Approve & Gen Clearance
                    </button>
                  ) : (
                    <Link to="/employees/$employeeId" params={{ employeeId: ex.employee_id }} className="text-sm font-semibold text-gray-600 hover:text-gray-900 inline-flex items-center gap-1">
                      View Clearance <ArrowRight size={14}/>
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {exits.length === 0 && (
          <div className="p-12 text-center text-gray-500">No active resignations.</div>
        )}
      </Card>
    </div>
  )
}
