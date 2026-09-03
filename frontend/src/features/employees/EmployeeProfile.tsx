import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import * as Tabs from '@radix-ui/react-tabs'
import {
  User, Briefcase, FileText, History, Mail, Phone, MapPin,
  Shield, Calendar, CreditCard, ArrowLeft, Upload, UserMinus
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Card } from '../../components/ui/Card'
import { apiFetch } from '../../lib/api'

function initials(f: string, l: string) {
  return `${f?.[0] ?? ''}${l?.[0] ?? ''}`.toUpperCase()
}

function avatarColor(name: string) {
  const colors = [
    'bg-[var(--color-primary)]/10 theme-accent-text border border-[var(--color-primary)]/30',
    'bg-indigo-500/10 text-indigo-500 border border-indigo-500/30',
    'bg-violet-500/10 text-violet-500 border border-violet-500/30',
    'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30',
    'bg-amber-500/10 text-amber-500 border border-amber-500/30',
    'bg-rose-500/10 text-rose-500 border border-rose-500/30',
    'bg-cyan-500/10 text-cyan-500 border border-cyan-500/30',
  ]
  return colors[(name?.charCodeAt(0) ?? 0) % colors.length]
}

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="py-2.5 border-b border-[var(--border-color)] last:border-0 flex sm:flex-row flex-col sm:items-center sm:justify-between gap-1 font-mono text-xs">
    <span className="text-[var(--text-muted)]">{label}</span>
    <span className="font-semibold text-[var(--text-main)] text-right">{value || '—'}</span>
  </div>
)

export const EmployeeProfile = ({ employeeId }: { employeeId: string }) => {
  const { hasScope } = useAuth()
  
  const { data, isLoading, isError } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      const res = await apiFetch(`/api/v1/employees/${employeeId}`)
      if (!res.ok) throw new Error('Failed to fetch profile')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in font-mono text-xs max-w-5xl mx-auto p-6">
        <div className="h-40 bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] animate-pulse" />
        <div className="h-96 bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] animate-pulse" />
      </div>
    )
  }

  if (isError || !data?.data) {
    return (
      <div className="p-8 text-center font-mono text-xs">
        <p className="text-rose-500">Failed to load employee profile.</p>
        <Link to="/employees" className="theme-accent-text hover:underline mt-2 inline-block">Back to Directory</Link>
      </div>
    )
  }

  const emp = data.data

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in font-mono">
      <Link to="/employees" className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors font-mono">
        <ArrowLeft size={14} /> Back to Directory
      </Link>
      
      {/* Profile Header Card */}
      <Card className="p-6 relative overflow-hidden bg-[var(--bg-card)] border-[var(--border-color)] font-mono">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
          <div className="shrink-0">
            <div className={`h-20 w-20 rounded-full flex items-center justify-center font-bold text-2xl border-2 border-[var(--border-color)] shadow ${avatarColor(emp.full_name)}`}>
              {initials(emp.first_name, emp.last_name)}
            </div>
          </div>

          <div className="flex-1 w-full">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-main)] font-sans tracking-tight">{emp.full_name}</h1>
                <p className="text-[var(--text-muted)] text-xs font-mono mt-1">
                  {emp.designation_name ?? 'No Designation'} {emp.department_name && `• ${emp.department_name}`}
                </p>
              </div>
              <div className="flex flex-col gap-1 sm:items-end">
                <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded border ${
                  emp.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border-[var(--border-color)]'
                }`}>
                  {emp.status}
                </span>
                <span className="text-[11px] font-mono text-[var(--text-muted)]">{emp.employee_id}</span>
              </div>
            </div>
            
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[var(--text-main)] font-mono">
              <div className="flex items-center gap-2"><Mail size={14} className="text-[var(--text-muted)]" /> {emp.work_email || emp.personal?.personal_email || 'No email'}</div>
              <div className="flex items-center gap-2"><Phone size={14} className="text-[var(--text-muted)]" /> {emp.work_phone || emp.personal?.phone_number || 'No phone'}</div>
              <div className="flex items-center gap-2"><MapPin size={14} className="text-[var(--text-muted)]" /> {emp.location_name || 'No location'}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs Card */}
      <Card className="p-0 overflow-hidden border-[var(--border-color)] bg-[var(--bg-card)]">
        <Tabs.Root defaultValue="overview" className="flex flex-col">
          <Tabs.List className="flex border-b border-[var(--border-color)] px-3 bg-[var(--bg-subtle)] font-mono text-xs overflow-x-auto hide-scrollbar">
            {[
              { id: 'overview', icon: Shield, label: 'Overview' },
              { id: 'personal', icon: User, label: 'Personal' },
              { id: 'work', icon: Briefcase, label: 'Work Info' },
              { id: 'statutory', icon: CreditCard, label: 'Statutory' },
              { id: 'documents', icon: FileText, label: 'Documents' },
              { id: 'timeline', icon: History, label: 'Timeline' },
              { id: 'offboarding', icon: UserMinus, label: 'Offboarding' },
            ].map(t => (
              <Tabs.Trigger
                key={t.id}
                value={t.id}
                className="px-4 py-3 font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] border-b-2 border-transparent data-[state=active]:border-[var(--color-primary)] data-[state=active]:theme-accent-text transition-colors flex items-center gap-2 shrink-0"
              >
                <t.icon size={14} /> {t.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <div className="p-6 text-[var(--text-main)]">
            <Tabs.Content value="overview" className="outline-none space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2 font-mono"><Briefcase size={14}/> Current Role</h3>
                  <div className="bg-[var(--bg-subtle)] rounded-lg p-4 space-y-1 border border-[var(--border-color)]">
                    <InfoRow label="Department" value={emp.department_name} />
                    <InfoRow label="Designation" value={emp.designation_name} />
                    <InfoRow label="Reporting To" value={emp.manager_name} />
                    <InfoRow label="Location" value={emp.location_name} />
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2 font-mono"><Calendar size={14}/> Tenure</h3>
                  <div className="bg-[var(--bg-subtle)] rounded-lg p-4 space-y-1 border border-[var(--border-color)]">
                    <InfoRow label="Joining Date" value={emp.joining_date} />
                    <InfoRow label="Employment Type" value={emp.employment_type} />
                    <InfoRow label="Probation End" value={emp.probation_end_date} />
                    <InfoRow label="Notice Period" value={`${emp.notice_period_days} Days`} />
                  </div>
                </div>
              </div>
            </Tabs.Content>

            <Tabs.Content value="personal" className="outline-none space-y-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 border-b border-[var(--border-color)] pb-2">Basic Details</h3>
                  <div className="space-y-1 bg-[var(--bg-subtle)] rounded-lg p-4 border border-[var(--border-color)]">
                    <InfoRow label="Date of Birth" value={emp.personal?.date_of_birth} />
                    <InfoRow label="Gender" value={emp.personal?.gender} />
                    <InfoRow label="Blood Group" value={emp.personal?.blood_group} />
                    <InfoRow label="Marital Status" value={emp.personal?.marital_status} />
                    <InfoRow label="Nationality" value={emp.nationality} />
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 border-b border-[var(--border-color)] pb-2">Contact Info</h3>
                  <div className="space-y-1 bg-[var(--bg-subtle)] rounded-lg p-4 border border-[var(--border-color)]">
                    <InfoRow label="Personal Email" value={emp.personal?.personal_email} />
                    <InfoRow label="Phone Number" value={emp.personal?.phone_number} />
                    <InfoRow label="Emergency Contact" value={emp.personal?.emergency_contact_name} />
                    <InfoRow label="Emergency Phone" value={emp.personal?.emergency_contact_number} />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 border-b border-[var(--border-color)] pb-2">Addresses</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-[var(--bg-subtle)] rounded-lg p-4 border border-[var(--border-color)]">
                      <p className="text-xs text-[var(--text-muted)] mb-1 font-mono">Current Address</p>
                      <p className="text-xs text-[var(--text-main)] whitespace-pre-wrap font-mono">{emp.personal?.current_address || '—'}</p>
                    </div>
                    <div className="bg-[var(--bg-subtle)] rounded-lg p-4 border border-[var(--border-color)]">
                      <p className="text-xs text-[var(--text-muted)] mb-1 font-mono">Permanent Address</p>
                      <p className="text-xs text-[var(--text-main)] whitespace-pre-wrap font-mono">{emp.personal?.permanent_address || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Tabs.Content>

            <Tabs.Content value="work" className="outline-none">
              <div className="max-w-2xl">
                <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 border-b border-[var(--border-color)] pb-2">Employment Information</h3>
                <div className="space-y-1 bg-[var(--bg-subtle)] rounded-lg p-4 border border-[var(--border-color)]">
                  <InfoRow label="Employee ID" value={<span className="font-mono">{emp.employee_id}</span>} />
                  <InfoRow label="System Status" value={emp.status} />
                  <InfoRow label="Employment Type" value={emp.employment_type} />
                  <InfoRow label="Joining Date" value={emp.joining_date} />
                  <InfoRow label="Confirmation Date" value={emp.confirmation_date} />
                  <InfoRow label="Probation End" value={emp.probation_end_date} />
                  <InfoRow label="Notice Period" value={`${emp.notice_period_days} Days`} />
                </div>
              </div>
            </Tabs.Content>

            <Tabs.Content value="statutory" className="outline-none">
              <div className="max-w-2xl">
                <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 border-b border-[var(--border-color)] pb-2">Statutory & Bank Details</h3>
                {!hasScope('SALARY_ACCESS') && emp.id !== employeeId ? (
                  <div className="p-4 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded-lg text-center text-[var(--text-muted)] text-xs font-mono">
                    <Shield className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
                    You do not have permission to view statutory and bank details for this employee.
                  </div>
                ) : !emp.statutory ? (
                   <div className="p-4 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded-lg text-center text-[var(--text-muted)] text-xs font-mono">
                    No statutory details recorded.
                  </div>
                ) : (
                  <div className="space-y-1 bg-[var(--bg-subtle)] rounded-lg p-4 border border-[var(--border-color)]">
                    <InfoRow label="PAN Number" value={<span className="font-mono uppercase theme-accent-text">{emp.statutory.pan_number}</span>} />
                    <InfoRow label="Aadhaar Number" value={<span className="font-mono">{emp.statutory.aadhaar_number}</span>} />
                    <InfoRow label="UAN Number" value={<span className="font-mono">{emp.statutory.uan_number}</span>} />
                    <InfoRow label="PF Number" value={<span className="font-mono uppercase">{emp.statutory.pf_number}</span>} />
                    <InfoRow label="ESIC Number" value={<span className="font-mono">{emp.statutory.esic_number}</span>} />
                    <div className="my-4 border-t border-[var(--border-color)]" />
                    <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 pt-2">Bank Information</h4>
                    <InfoRow label="Bank Name" value={emp.statutory.bank_name} />
                    <InfoRow label="Account Number" value={<span className="font-mono">{emp.statutory.bank_account_number}</span>} />
                    <InfoRow label="IFSC Code" value={<span className="font-mono uppercase theme-accent-text">{emp.statutory.ifsc_code}</span>} />
                  </div>
                )}
              </div>
            </Tabs.Content>

            <Tabs.Content value="documents" className="outline-none">
              <div className="max-w-4xl">
                <EmployeeDocuments employeeId={employeeId} />
              </div>
            </Tabs.Content>
            
            <Tabs.Content value="timeline" className="outline-none">
              <div className="max-w-2xl">
                <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-6 border-b border-[var(--border-color)] pb-2">Employee Lifecycle</h3>
                <EmployeeTimeline employeeId={employeeId} />
              </div>
            </Tabs.Content>
            
            <Tabs.Content value="offboarding" className="outline-none">
              <div className="max-w-4xl">
                <EmployeeOffboarding employeeId={employeeId} />
              </div>
            </Tabs.Content>
          </div>
        </Tabs.Root>
      </Card>
    </div>
  )
}

const EmployeeTimeline = ({ employeeId }: { employeeId: string }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['timeline', employeeId],
    queryFn: async () => {
      const res = await apiFetch(`/api/v1/lifecycle/employees/${employeeId}/timeline`)
      if (!res.ok) throw new Error('Failed to fetch timeline')
      return res.json()
    }
  })

  if (isLoading) return <div className="text-xs font-mono text-[var(--text-muted)] py-4">Loading timeline...</div>
  if (isError) return <div className="text-xs font-mono text-rose-500 py-4">Failed to load timeline.</div>

  const events = data?.data || []

  if (events.length === 0) {
    return <div className="text-xs font-mono text-[var(--text-muted)] py-4">No lifecycle events recorded.</div>
  }

  return (
    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-[var(--border-color)] font-mono text-xs">
      {events.map((evt: any) => (
        <div key={evt.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-[var(--border-color)] bg-[var(--color-primary)]/10 theme-accent-text shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
            <History size={16} />
          </div>
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="font-bold text-[var(--text-main)] text-xs">{evt.event_type.replace('_', ' ')}</div>
              <div className="text-[10px] font-mono font-medium theme-accent-text bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 px-2 py-0.5 rounded">{evt.effective_date}</div>
            </div>
            {evt.reason && <p className="text-xs text-[var(--text-muted)] mt-1">{evt.reason}</p>}
            {evt.new_value && Object.keys(evt.new_value).length > 0 && (
              <div className="mt-2 p-2 bg-[var(--bg-card)] rounded text-xs border border-[var(--border-color)]">
                {Object.entries(evt.new_value).map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="text-[var(--text-muted)] capitalize">{k.replace('_', ' ')}:</span>
                    <span className="font-medium text-[var(--text-main)]">{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

const EmployeeDocuments = ({ employeeId }: { employeeId: string }) => {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['employee-docs', employeeId],
    queryFn: async () => {
      const res = await apiFetch(`/api/v1/documents/employees/${employeeId}`)
      if (!res.ok) throw new Error('Failed to fetch documents')
      return res.json()
    }
  })

  const verifyDoc = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/v1/documents/${id}/verify`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Failed to verify document')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee-docs', employeeId] })
  })

  if (isLoading) return <div className="py-8 text-[var(--text-muted)] font-mono text-xs">Loading documents...</div>

  const docs = data?.data || []

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between mb-6 border-b border-[var(--border-color)] pb-2">
        <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Document Library</h3>
        <button className="text-xs font-medium theme-accent-text hover:underline flex items-center gap-1">
          <Upload size={14} /> Upload Document
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {docs.map((doc: any) => (
          <div key={doc.id} className="p-4 border border-[var(--border-color)] rounded-xl bg-[var(--bg-subtle)] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[var(--color-primary)]/10 theme-accent-text rounded-lg border border-[var(--color-primary)]/20"><FileText size={16}/></div>
                  <div>
                    <div className="font-medium text-[var(--text-main)]">{doc.document_type_name}</div>
                    <div className="text-[11px] text-[var(--text-muted)]">{doc.file_name}</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  doc.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                  doc.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                }`}>
                  {doc.status}
                </span>
              </div>
              {doc.rejection_reason && (
                <div className="mt-2 text-xs text-rose-500 bg-rose-500/10 p-2 rounded border border-rose-500/20">
                  <span className="font-semibold">Reason:</span> {doc.rejection_reason}
                </div>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border-color)] flex items-center justify-between">
              <div className="text-[11px] text-[var(--text-muted)]">Uploaded {doc.uploaded_at}</div>
              {doc.status === 'SUBMITTED' && (
                <button 
                  disabled={verifyDoc.isPending}
                  onClick={() => verifyDoc.mutate(doc.id)}
                  className="text-xs font-semibold theme-accent-text hover:underline disabled:opacity-50"
                >
                  Verify Now
                </button>
              )}
            </div>
          </div>
        ))}
        {docs.length === 0 && (
          <div className="col-span-full py-12 text-center text-[var(--text-muted)] border-2 border-dashed border-[var(--border-color)] rounded-xl font-mono">
            No documents uploaded yet.
          </div>
        )}
      </div>
    </div>
  )
}

const EmployeeOffboarding = ({ employeeId }: { employeeId: string }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['employee-clearance', employeeId],
    queryFn: async () => {
      const res = await apiFetch(`/api/v1/lifecycle/exits/${employeeId}/clearance`)
      if (!res.ok) throw new Error('Failed to fetch clearance tasks')
      return res.json()
    }
  })

  if (isLoading) return <div className="py-8 text-[var(--text-muted)] font-mono text-xs">Loading offboarding details...</div>

  const tasks = data?.data || []

  return (
    <div className="space-y-6 font-mono text-xs">
      <div className="bg-amber-500/10 text-amber-500 p-4 rounded-xl border border-amber-500/20 flex items-start gap-3">
        <UserMinus className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-semibold">Employee is serving notice period</h4>
          <p className="text-xs mt-1 text-amber-600 dark:text-amber-300">Last working day is scheduled for September 15, 2026. Please complete the clearance checklist below.</p>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-subtle)]">
          <h3 className="font-semibold text-[var(--text-main)]">Clearance Checklist</h3>
        </div>
        <table className="w-full text-left font-mono">
          <thead>
            <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border-color)]">
              <th className="px-6 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase">Department</th>
              <th className="px-6 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase">Task Description</th>
              <th className="px-6 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {tasks.map((t: any) => (
              <tr key={t.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                <td className="px-6 py-4 text-xs font-medium text-[var(--text-main)]">{t.department}</td>
                <td className="px-6 py-4 text-xs text-[var(--text-muted)]">{t.task_description}</td>
                <td className="px-6 py-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={t.status === 'COMPLETED'} readOnly className="w-4 h-4 rounded accent-[var(--color-primary)] bg-[var(--bg-card)] border-[var(--border-color)]" />
                    <span className={`text-xs font-bold uppercase ${t.status === 'COMPLETED' ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`}>
                      {t.status}
                    </span>
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tasks.length === 0 && (
          <div className="p-8 text-center text-[var(--text-muted)]">No clearance tasks assigned.</div>
        )}
      </div>
    </div>
  )
}
