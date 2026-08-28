import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { AlertCircle, CalendarClock, ChevronRight, Clock, ShieldAlert } from 'lucide-react'
import { Card } from '../../components/ui/Card'

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
    return <div className="p-8 font-mono text-xs text-slate-500">Loading probation records...</div>
  }

  if (isError) {
    return <div className="p-8 font-mono text-xs text-rose-400">Failed to load probation data.</div>
  }

  const { overdue, next_7_days, next_15_days, next_30_days } = data.data

  const renderSection = (title: string, icon: React.ReactNode, employees: ProbationEmployee[], headerBg: string, accentText: string) => (
    <Card className="p-0 overflow-hidden">
      <div className={`px-4 py-3 border-b border-slate-800 flex items-center justify-between font-mono text-xs ${headerBg}`}>
        <div className="flex items-center gap-2">
          {icon}
          <h3 className={`font-semibold ${accentText}`}>{title}</h3>
        </div>
        <span className={`px-2 py-0.5 rounded font-bold ${accentText} bg-slate-900/80 border border-slate-700`}>
          {employees.length}
        </span>
      </div>
      
      {employees.length === 0 ? (
        <div className="p-6 text-center text-xs font-mono text-slate-500">
          No employees due in this category.
        </div>
      ) : (
        <div className="divide-y divide-slate-800/60 font-mono text-xs">
          {employees.map(emp => (
            <div key={emp.id} className="p-3.5 hover:bg-slate-800/40 transition-colors flex items-center justify-between group">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="font-semibold text-slate-200">{emp.full_name}</h4>
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-1 rounded">{emp.employee_id}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {emp.designation} • {emp.department}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase">End Date</div>
                  <div className="font-bold text-slate-200">{emp.probation_end_date}</div>
                </div>
                <Link
                  to="/employees/$employeeId"
                  params={{ employeeId: emp.id }}
                  className="p-1.5 text-slate-400 hover:text-blue-400 rounded hover:bg-slate-800 transition-colors"
                  title="View Profile & Initiate Review"
                >
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div>
        <h1 className="text-[28px] font-bold text-slate-100 leading-tight tracking-tight">Probation Tracker</h1>
        <p className="text-xs font-mono text-slate-400 mt-1">TRACK CONFIRMATION DUE DATES & INITIATE PERFORMANCE REVIEWS</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {renderSection(
          "Overdue for Confirmation",
          <ShieldAlert size={16} className="text-rose-400" />,
          overdue,
          "bg-rose-500/10",
          "text-rose-400"
        )}

        {renderSection(
          "Due in Next 7 Days",
          <AlertCircle size={16} className="text-amber-400" />,
          next_7_days,
          "bg-amber-500/10",
          "text-amber-400"
        )}

        {renderSection(
          "Due in Next 15 Days",
          <Clock size={16} className="text-blue-400" />,
          next_15_days,
          "bg-blue-500/10",
          "text-blue-400"
        )}

        {renderSection(
          "Due in Next 30 Days",
          <CalendarClock size={16} className="text-emerald-400" />,
          next_30_days,
          "bg-emerald-500/10",
          "text-emerald-400"
        )}
      </div>
    </div>
  )
}
