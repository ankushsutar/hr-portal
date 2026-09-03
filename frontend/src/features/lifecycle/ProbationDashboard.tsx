import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { AlertCircle, CalendarClock, ChevronRight, Clock, ShieldAlert } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { apiFetch } from '../../lib/api'

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
      const res = await apiFetch('/api/v1/lifecycle/probation-due')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    }
  })

  if (isLoading) {
    return <div className="p-8 font-mono text-xs text-[var(--text-muted)]">Loading probation records...</div>
  }

  if (isError) {
    return <div className="p-8 font-mono text-xs text-rose-500">Failed to load probation data.</div>
  }

  const { overdue, next_7_days, next_15_days, next_30_days } = data.data

  const renderSection = (title: string, icon: React.ReactNode, employees: ProbationEmployee[], headerBg: string, accentText: string) => (
    <Card className="p-0 overflow-hidden bg-[var(--bg-card)] border-[var(--border-color)]">
      <div className={`px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between font-mono text-xs ${headerBg}`}>
        <div className="flex items-center gap-2">
          {icon}
          <h3 className={`font-semibold ${accentText}`}>{title}</h3>
        </div>
        <span className={`px-2 py-0.5 rounded font-bold ${accentText} bg-[var(--bg-card)] border border-[var(--border-color)]`}>
          {employees.length}
        </span>
      </div>
      
      {employees.length === 0 ? (
        <div className="p-6 text-center text-xs font-mono text-[var(--text-muted)]">
          No employees due in this category.
        </div>
      ) : (
        <div className="divide-y divide-[var(--border-color)] font-mono text-xs text-[var(--text-main)]">
          {employees.map(emp => (
            <div key={emp.id} className="p-3.5 hover:bg-[var(--bg-subtle)] transition-colors flex items-center justify-between group">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="font-semibold text-[var(--text-main)]">{emp.full_name}</h4>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono bg-[var(--bg-subtle)] px-1 rounded border border-[var(--border-color)]">{emp.employee_id}</span>
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  {emp.designation} • {emp.department}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase">End Date</div>
                  <div className="font-bold text-[var(--text-main)]">{emp.probation_end_date}</div>
                </div>
                <Link
                  to="/employees/$employeeId"
                  params={{ employeeId: emp.id }}
                  className="p-1.5 text-[var(--text-muted)] hover:theme-accent-text rounded hover:bg-[var(--bg-subtle)] transition-colors"
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
        <h1 className="text-[28px] font-bold text-[var(--text-main)] leading-tight tracking-tight">Probation Tracker</h1>
        <p className="text-xs font-mono text-[var(--text-muted)] mt-1">TRACK CONFIRMATION DUE DATES & INITIATE PERFORMANCE REVIEWS</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {renderSection(
          "Overdue for Confirmation",
          <ShieldAlert size={16} className="text-rose-500" />,
          overdue,
          "bg-rose-500/10",
          "text-rose-500"
        )}

        {renderSection(
          "Due in Next 7 Days",
          <AlertCircle size={16} className="text-amber-500" />,
          next_7_days,
          "bg-amber-500/10",
          "text-amber-500"
        )}

        {renderSection(
          "Due in Next 15 Days",
          <Clock size={16} className="theme-accent-text" />,
          next_15_days,
          "bg-[var(--color-primary)]/10",
          "theme-accent-text"
        )}

        {renderSection(
          "Due in Next 30 Days",
          <CalendarClock size={16} className="text-emerald-500" />,
          next_30_days,
          "bg-emerald-500/10",
          "text-emerald-500"
        )}
      </div>
    </div>
  )
}
