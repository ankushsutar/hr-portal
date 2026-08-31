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
    'bg-blue-900/60 text-blue-300 border border-blue-700/50',
    'bg-indigo-900/60 text-indigo-300 border border-indigo-700/50',
    'bg-violet-900/60 text-violet-300 border border-violet-700/50',
    'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50',
    'bg-amber-900/60 text-amber-300 border border-amber-700/50',
    'bg-rose-900/60 text-rose-300 border border-rose-700/50',
    'bg-cyan-900/60 text-cyan-300 border border-cyan-700/50',
  ]
  return colors[(name?.charCodeAt(0) ?? 0) % colors.length]
}

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="py-2.5 border-b border-slate-800/80 last:border-0 flex sm:flex-row flex-col sm:items-center sm:justify-between gap-1 font-mono text-xs">
    <span className="text-slate-400">{label}</span>
    <span className="font-semibold text-slate-200 text-right">{value || '—'}</span>
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
        <div className="h-40 bg-[#111827] rounded-lg border border-slate-800 animate-pulse" />
        <div className="h-96 bg-[#111827] rounded-lg border border-slate-800 animate-pulse" />
      </div>
    )
  }

  if (isError || !data?.data) {
    return (
      <div className="p-8 text-center font-mono text-xs">
        <p className="text-rose-400">Failed to load employee profile.</p>
        <Link to="/employees" className="text-blue-400 hover:underline mt-2 inline-block">Back to Directory</Link>
      </div>
    )
  }

  const emp = data.data

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in font-mono">
      <Link to="/employees" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors font-mono">
        <ArrowLeft size={14} /> Back to Directory
      </Link>
      
      {/* Profile Header Card */}
      <Card className="p-6 relative overflow-hidden bg-slate-900/90 border-slate-800 font-mono">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
          <div className="shrink-0">
            <div className={`h-20 w-20 rounded-full flex items-center justify-center font-bold text-2xl border-2 border-slate-700 shadow ${avatarColor(emp.full_name)}`}>
              {initials(emp.first_name, emp.last_name)}
            </div>
          </div>

          <div className="flex-1 w-full">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-100 font-sans tracking-tight">{emp.full_name}</h1>
                <p className="text-slate-400 text-xs font-mono mt-1">
                  {emp.designation_name ?? 'No Designation'} {emp.department_name && `• ${emp.department_name}`}
                </p>
              </div>
              <div className="flex flex-col gap-1 sm:items-end">
                <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded border ${
                  emp.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {emp.status}
                </span>
                <span className="text-[11px] font-mono text-slate-400">{emp.employee_id}</span>
              </div>
            </div>
            
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-300 font-mono">
              <div className="flex items-center gap-2"><Mail size={14} className="text-slate-500" /> {emp.work_email || emp.personal?.personal_email || 'No email'}</div>
              <div className="flex items-center gap-2"><Phone size={14} className="text-slate-500" /> {emp.work_phone || emp.personal?.phone_number || 'No phone'}</div>
              <div className="flex items-center gap-2"><MapPin size={14} className="text-slate-500" /> {emp.location_name || 'No location'}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs Card */}
      <Card className="p-0 overflow-hidden border-slate-800 bg-[#111827]">
        <Tabs.Root defaultValue="overview" className="flex flex-col">
          <Tabs.List className="flex border-b border-slate-800 px-3 bg-slate-900/80 font-mono text-xs overflow-x-auto hide-scrollbar">
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
                className="px-4 py-3 font-medium text-slate-400 hover:text-slate-200 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-400 transition-colors flex items-center gap-2 shrink-0"
              >
                <t.icon size={14} /> {t.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <div className="p-6">
            <Tabs.Content value="overview" className="outline-none space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2 font-mono"><Briefcase size={14}/> Current Role</h3>
                  <div className="bg-slate-900/60 rounded-lg p-4 space-y-1 border border-slate-800/80">
                    <InfoRow label="Department" value={emp.department_name} />
                    <InfoRow label="Designation" value={emp.designation_name} />
                    <InfoRow label="Reporting To" value={emp.manager_name} />
                    <InfoRow label="Location" value={emp.location_name} />
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2 font-mono"><Calendar size={14}/> Tenure</h3>
                  <div className="bg-slate-900/60 rounded-lg p-4 space-y-1 border border-slate-800/80">
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
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-800 pb-2">Basic Details</h3>
                  <div className="space-y-1 bg-slate-900/60 rounded-lg p-4 border border-slate-800/80">
                    <InfoRow label="Date of Birth" value={emp.personal?.date_of_birth} />
                    <InfoRow label="Gender" value={emp.personal?.gender} />
                    <InfoRow label="Blood Group" value={emp.personal?.blood_group} />
                    <InfoRow label="Marital Status" value={emp.personal?.marital_status} />
                    <InfoRow label="Nationality" value={emp.nationality} />
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-800 pb-2">Contact Info</h3>
                  <div className="space-y-1 bg-slate-900/60 rounded-lg p-4 border border-slate-800/80">
                    <InfoRow label="Personal Email" value={emp.personal?.personal_email} />
                    <InfoRow label="Phone Number" value={emp.personal?.phone_number} />
                    <InfoRow label="Emergency Contact" value={emp.personal?.emergency_contact_name} />
                    <InfoRow label="Emergency Phone" value={emp.personal?.emergency_contact_number} />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-800 pb-2">Addresses</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-800/80">
                      <p className="text-xs text-slate-400 mb-1 font-mono">Current Address</p>
                      <p className="text-xs text-slate-200 whitespace-pre-wrap font-mono">{emp.personal?.current_address || '—'}</p>
                    </div>
                    <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-800/80">
                      <p className="text-xs text-slate-400 mb-1 font-mono">Permanent Address</p>
                      <p className="text-xs text-slate-200 whitespace-pre-wrap font-mono">{emp.personal?.permanent_address || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Tabs.Content>

            <Tabs.Content value="work" className="outline-none">
              <div className="max-w-2xl">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-800 pb-2">Employment Information</h3>
                <div className="space-y-1 bg-slate-900/60 rounded-lg p-4 border border-slate-800/80">
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
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-800 pb-2">Statutory & Bank Details</h3>
                {!hasScope('SALARY_ACCESS') && emp.id !== employeeId ? (
                  <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg text-center text-slate-400 text-xs font-mono">
                    <Shield className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    You do not have permission to view statutory and bank details for this employee.
                  </div>
                ) : !emp.statutory ? (
                   <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg text-center text-slate-400 text-xs font-mono">
                    No statutory details recorded.
                  </div>
                ) : (
                  <div className="space-y-1 bg-slate-900/60 rounded-lg p-4 border border-slate-800/80">
                    <InfoRow label="PAN Number" value={<span className="font-mono uppercase text-blue-400">{emp.statutory.pan_number}</span>} />
                    <InfoRow label="Aadhaar Number" value={<span className="font-mono">{emp.statutory.aadhaar_number}</span>} />
                    <InfoRow label="UAN Number" value={<span className="font-mono">{emp.statutory.uan_number}</span>} />
                    <InfoRow label="PF Number" value={<span className="font-mono uppercase">{emp.statutory.pf_number}</span>} />
                    <InfoRow label="ESIC Number" value={<span className="font-mono">{emp.statutory.esic_number}</span>} />
                    <div className="my-4 border-t border-slate-800" />
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pt-2">Bank Information</h4>
                    <InfoRow label="Bank Name" value={emp.statutory.bank_name} />
                    <InfoRow label="Account Number" value={<span className="font-mono">{emp.statutory.bank_account_number}</span>} />
                    <InfoRow label="IFSC Code" value={<span className="font-mono uppercase text-blue-400">{emp.statutory.ifsc_code}</span>} />
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
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 border-b border-slate-800 pb-2">Employee Lifecycle</h3>
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

  if (isLoading) return <div className="text-xs font-mono text-slate-500 py-4">Loading timeline...</div>
  if (isError) return <div className="text-xs font-mono text-rose-400 py-4">Failed to load timeline.</div>

  const events = data?.data || []

  if (events.length === 0) {
    return <div className="text-xs font-mono text-slate-500 py-4">No lifecycle events recorded.</div>
  }

  return (
    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-800 font-mono text-xs">
      {events.map((evt: any) => (
        <div key={evt.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-slate-700 bg-blue-500/10 text-blue-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
            <History size={16} />
          </div>
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border border-slate-800 bg-slate-900/60 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="font-bold text-slate-200 text-xs">{evt.event_type.replace('_', ' ')}</div>
              <div className="text-[10px] font-mono font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">{evt.effective_date}</div>
            </div>
            {evt.reason && <p className="text-xs text-slate-400 mt-1">{evt.reason}</p>}
            {evt.new_value && Object.keys(evt.new_value).length > 0 && (
              <div className="mt-2 p-2 bg-slate-950 rounded text-xs border border-slate-800">
                {Object.entries(evt.new_value).map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="text-slate-500 capitalize">{k.replace('_', ' ')}:</span>
                    <span className="font-medium text-slate-300">{String(v)}</span>
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

  if (isLoading) return <div className="py-8 text-slate-500 font-mono text-xs">Loading documents...</div>

  const docs = data?.data || []

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Document Library</h3>
        <button className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1">
          <Upload size={14} /> Upload Document
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {docs.map((doc: any) => (
          <div key={doc.id} className="p-4 border border-slate-800 rounded-xl bg-slate-900/60 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20"><FileText size={16}/></div>
                  <div>
                    <div className="font-medium text-slate-200">{doc.document_type_name}</div>
                    <div className="text-[11px] text-slate-500">{doc.file_name}</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  doc.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  doc.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {doc.status}
                </span>
              </div>
              {doc.rejection_reason && (
                <div className="mt-2 text-xs text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/20">
                  <span className="font-semibold">Reason:</span> {doc.rejection_reason}
                </div>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="text-[11px] text-slate-500">Uploaded {doc.uploaded_at}</div>
              {doc.status === 'SUBMITTED' && (
                <button 
                  disabled={verifyDoc.isPending}
                  onClick={() => verifyDoc.mutate(doc.id)}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 disabled:opacity-50"
                >
                  Verify Now
                </button>
              )}
            </div>
          </div>
        ))}
        {docs.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl font-mono">
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

  if (isLoading) return <div className="py-8 text-slate-500 font-mono text-xs">Loading offboarding details...</div>

  const tasks = data?.data || []

  return (
    <div className="space-y-6 font-mono text-xs">
      <div className="bg-amber-500/10 text-amber-400 p-4 rounded-xl border border-amber-500/20 flex items-start gap-3">
        <UserMinus className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-semibold">Employee is serving notice period</h4>
          <p className="text-xs mt-1 text-amber-300">Last working day is scheduled for September 15, 2026. Please complete the clearance checklist below.</p>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900">
          <h3 className="font-semibold text-slate-200">Clearance Checklist</h3>
        </div>
        <table className="w-full text-left font-mono">
          <thead>
            <tr className="bg-slate-900/40 border-b border-slate-800">
              <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Department</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Task Description</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {tasks.map((t: any) => (
              <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-6 py-4 text-xs font-medium text-slate-200">{t.department}</td>
                <td className="px-6 py-4 text-xs text-slate-400">{t.task_description}</td>
                <td className="px-6 py-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={t.status === 'COMPLETED'} readOnly className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500 bg-slate-800 border-slate-700" />
                    <span className={`text-xs font-bold uppercase ${t.status === 'COMPLETED' ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {t.status}
                    </span>
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tasks.length === 0 && (
          <div className="p-8 text-center text-slate-500">No clearance tasks assigned.</div>
        )}
      </div>
    </div>
  )
}
