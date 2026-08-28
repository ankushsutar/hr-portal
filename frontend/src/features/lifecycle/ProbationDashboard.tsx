import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { AlertCircle, CalendarClock, ChevronRight, Clock, ShieldAlert } from 'lucide-react'

interface ProbationEmployee {
  id: string
  employee_id: string
  full_name: string
  department: string
  designation: string
  joining_date: string
  probation_end_date: string
  status: string
}

export const ProbationDashboard = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['probation-due'],
    queryFn: async () => {
      const res = await fetch('/api/v1/lifecycle/probation-due')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    }
  })

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>
  }

  if (isError) {
    return <div className="p-8 text-center text-red-500">Failed to load probation data.</div>
  }

  const { overdue, next_7_days, next_15_days, next_30_days } = data.data

  const renderSection = (title: string, icon: React.ReactNode, employees: ProbationEmployee[], colorClass: string) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className={`p-4 border-b border-gray-100 flex items-center justify-between ${colorClass.split(' ')[0]}`}>
        <div className="flex items-center gap-2">
          {icon}
          <h3 className={`font-semibold ${colorClass.split(' ')[1]}`}>{title}</h3>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold bg-white ${colorClass.split(' ')[1]}`}>
          {employees.length}
        </span>
      </div>
      
      {employees.length === 0 ? (
        <div className="p-6 text-center text-sm text-gray-500 bg-gray-50/50">
          No employees in this category.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {employees.map(emp => (
            <div key={emp.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-medium text-gray-900 text-sm">{emp.full_name}</h4>
                  <span className="text-xs text-gray-400 font-mono">{emp.employee_id}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {emp.designation} • {emp.department}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-0.5">End Date</div>
                  <div className="text-sm font-medium text-gray-900">{emp.probation_end_date}</div>
                </div>
                <Link
                  to="/employees/$employeeId"
                  params={{ employeeId: emp.id }}
                  className="p-2 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                  title="View Profile & Initiate Review"
                >
                  <ChevronRight size={18} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Probation Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Track upcoming probation expirations and initiate confirmation workflows.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {renderSection(
          "Overdue for Confirmation",
          <ShieldAlert size={18} className="text-red-700" />,
          overdue,
          "bg-red-50 text-red-900"
        )}

        {renderSection(
          "Due in Next 7 Days",
          <AlertCircle size={18} className="text-orange-700" />,
          next_7_days,
          "bg-orange-50 text-orange-900"
        )}

        {renderSection(
          "Due in Next 15 Days",
          <Clock size={18} className="text-blue-700" />,
          next_15_days,
          "bg-blue-50 text-blue-900"
        )}

        {renderSection(
          "Due in Next 30 Days",
          <CalendarClock size={18} className="text-emerald-700" />,
          next_30_days,
          "bg-emerald-50 text-emerald-900"
        )}
      </div>
    </div>
  )
}
