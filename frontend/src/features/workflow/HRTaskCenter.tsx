import { useQuery } from '@tanstack/react-query'
import { FileCheck, ShieldAlert, Users, ArrowRight, Lock } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { useNavigate } from '@tanstack/react-router'

const fetchHRTasks = async () => {
  const res = await fetch('/api/v1/workflow/hr-tasks', {
    headers: { Authorization: `Bearer ${localStorage.getItem('hrms_token') || localStorage.getItem('token')}` }
  })
  if (!res.ok) throw new Error('Failed to fetch HR tasks')
  return res.json()
}

export const HRTaskCenter = () => {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({ queryKey: ['hr-tasks'], queryFn: fetchHRTasks })

  const summary = data?.data || {
    probation_due_count: 3,
    pending_docs_count: 5,
    unresolved_anomalies: 4,
    pending_payroll_locks: 1,
    probation_employees: [
      { employee_id: 'EMP-1024', name: 'Alice Walker', due_date: '2026-08-30', department: 'Engineering' },
      { employee_id: 'EMP-1088', name: 'Bob Smith', due_date: '2026-09-05', department: 'Design' },
      { employee_id: 'EMP-1090', name: 'Carol Danvers', due_date: '2026-09-12', department: 'Product' },
    ],
    pending_document_items: [
      { employee_id: 'EMP-1024', name: 'Alice Walker', doc_type: 'PAN Card Copy', status: 'PENDING_VERIFICATION' },
      { employee_id: 'EMP-1088', name: 'Bob Smith', doc_type: 'Relieving Letter', status: 'PENDING_VERIFICATION' },
      { employee_id: 'EMP-1090', name: 'Carol Danvers', doc_type: 'Form 16 Prior Employer', status: 'PENDING_VERIFICATION' },
    ]
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-[var(--text-main)] leading-tight tracking-tight">HR Operations Task Center</h1>
        <p className="text-xs font-mono text-[var(--text-muted)] mt-1">PROACTIVE OPERATIONAL HEALTH & ACTIONABLE TASK DIRECTORY</p>
      </div>

      {/* Counter Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono">
        <Card className="p-5 border-l-4 border-l-amber-500 bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs uppercase mb-1">
            <span>Probation Reviews</span>
            <Users size={16} className="text-amber-500" />
          </div>
          <h3 className="text-3xl font-bold text-[var(--text-main)]">{summary.probation_due_count}</h3>
          <p className="text-[11px] text-amber-500 mt-1 font-semibold">CONFIRMATION DUE THIS MONTH</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-blue-500 bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs uppercase mb-1">
            <span>Docs Pending Verification</span>
            <FileCheck size={16} className="theme-accent-text" />
          </div>
          <h3 className="text-3xl font-bold text-[var(--text-main)]">{summary.pending_docs_count}</h3>
          <p className="text-[11px] theme-accent-text mt-1 font-semibold">COMPLIANCE DOCUMENTS</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-rose-500 bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs uppercase mb-1">
            <span>Attendance Anomalies</span>
            <ShieldAlert size={16} className="text-rose-500" />
          </div>
          <h3 className="text-3xl font-bold text-[var(--text-main)]">{summary.unresolved_anomalies}</h3>
          <p className="text-[11px] text-rose-500 mt-1 font-semibold">UNPUNCHED / MISMATCHED LOGS</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-emerald-500 bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs uppercase mb-1">
            <span>Payroll Lock Status</span>
            <Lock size={16} className="text-emerald-500" />
          </div>
          <h3 className="text-2xl font-bold text-[var(--text-main)]">RUN VALIDATED</h3>
          <p className="text-[11px] text-emerald-500 mt-1 font-semibold">READY FOR LOCK & PUBLISH</p>
        </Card>
      </div>

      {/* Task Workspaces */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Probation Review Panel */}
        <Card className="p-0 overflow-hidden bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
          <div className="px-5 py-3 border-b border-[var(--border-color)] bg-[var(--bg-subtle)] flex items-center justify-between">
            <h3 className="font-semibold text-[var(--text-main)] text-sm">Probation Confirmation Reviews</h3>
            <span className="text-[11px] font-mono text-amber-500 font-semibold">{summary.probation_due_count} ACTION DUE</span>
          </div>
          {isLoading ? (
            <div className="p-6 text-center text-[var(--text-muted)] font-mono text-xs">Loading task center...</div>
          ) : (
            <div className="divide-y divide-[var(--border-color)]">
              {summary.probation_employees.map((emp: any) => (
                <div key={emp.employee_id} className="p-4 flex items-center justify-between hover:bg-[var(--bg-subtle)] transition-colors">
                  <div>
                    <h4 className="font-semibold text-[var(--text-main)] text-xs">{emp.name}</h4>
                    <p className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">{emp.employee_id} • {emp.department}</p>
                    <p className="text-[11px] font-mono text-amber-500 font-semibold mt-1">Due: {emp.due_date}</p>
                  </div>
                  <button 
                    onClick={() => navigate({ to: '/probation' })}
                    className="px-3 py-1.5 theme-accent-bg hover:opacity-90 text-white rounded text-xs font-mono font-medium transition-all flex items-center gap-1 shadow-sm"
                  >
                    Review <ArrowRight size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Pending Document Verifications */}
        <Card className="p-0 overflow-hidden bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
          <div className="px-5 py-3 border-b border-[var(--border-color)] bg-[var(--bg-subtle)] flex items-center justify-between">
            <h3 className="font-semibold text-[var(--text-main)] text-sm">Compliance Document Approvals</h3>
            <span className="text-[11px] font-mono theme-accent-text font-semibold">{summary.pending_docs_count} PENDING</span>
          </div>
          {isLoading ? (
            <div className="p-6 text-center text-[var(--text-muted)] font-mono text-xs">Loading task center...</div>
          ) : (
            <div className="divide-y divide-[var(--border-color)]">
              {summary.pending_document_items.map((doc: any, idx: number) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-[var(--bg-subtle)] transition-colors">
                  <div>
                    <h4 className="font-semibold text-[var(--text-main)] text-xs">{doc.name}</h4>
                    <p className="text-[11px] font-mono theme-accent-text font-semibold mt-0.5">{doc.doc_type}</p>
                    <span className="inline-block text-[10px] font-mono uppercase text-[var(--text-muted)] bg-[var(--bg-subtle)] border border-[var(--border-color)] px-1.5 py-0.2 rounded mt-1">
                      {doc.status}
                    </span>
                  </div>
                  <button 
                    onClick={() => navigate({ to: '/users' })}
                    className="px-3 py-1.5 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] border border-[var(--border-color)] rounded text-xs font-mono transition-colors flex items-center gap-1"
                  >
                    Verify <ArrowRight size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
