import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import * as Tabs from '@radix-ui/react-tabs'
import {
  User, Briefcase, FileText, History, Mail, Phone, MapPin,
  Shield, Calendar, CreditCard, ArrowLeft, Upload
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

function initials(f: string, l: string) {
  return `${f?.[0] ?? ''}${l?.[0] ?? ''}`.toUpperCase()
}

function avatarColor(name: string) {
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-indigo-100 text-indigo-700',
    'bg-violet-100 text-violet-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-cyan-100 text-cyan-700',
  ]
  return colors[(name?.charCodeAt(0) ?? 0) % colors.length]
}

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="py-3 border-b border-gray-100 last:border-0 flex sm:flex-row flex-col sm:items-center sm:justify-between gap-1">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="text-sm font-medium text-gray-900 text-right">{value || '—'}</span>
  </div>
)

export const EmployeeProfile = ({ employeeId }: { employeeId: string }) => {
  const { hasScope } = useAuth()
  
  const { data, isLoading, isError } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/employees/${employeeId}`)
      if (!res.ok) throw new Error('Failed to fetch profile')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="h-40 bg-white rounded-xl shadow-sm border border-gray-200 animate-pulse" />
        <div className="h-96 bg-white rounded-xl shadow-sm border border-gray-200 animate-pulse" />
      </div>
    )
  }

  if (isError || !data?.data) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Failed to load employee profile.</p>
        <Link to="/employees" className="text-blue-600 hover:underline text-sm mt-2 inline-block">Back to Directory</Link>
      </div>
    )
  }

  const emp = data.data

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <Link to="/employees" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={14} /> Back to Directory
      </Link>

      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-10"></div>
        
        <div className="relative z-10 shrink-0">
          <div className={`h-24 w-24 rounded-full flex items-center justify-center font-bold text-3xl border-4 border-white shadow-sm ${avatarColor(emp.full_name)}`}>
            {initials(emp.first_name, emp.last_name)}
          </div>
        </div>

        <div className="relative z-10 flex-1 w-full">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{emp.full_name}</h1>
              <p className="text-gray-500 font-medium mt-0.5">
                {emp.designation_name ?? 'No Designation'} {emp.department_name && `• ${emp.department_name}`}
              </p>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${emp.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {emp.status}
              </span>
              <span className="text-xs font-mono text-gray-400">{emp.employee_id}</span>
            </div>
          </div>
          
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2"><Mail size={15} className="text-gray-400" /> {emp.work_email || emp.personal?.personal_email || 'No email'}</div>
            <div className="flex items-center gap-2"><Phone size={15} className="text-gray-400" /> {emp.work_phone || emp.personal?.phone_number || 'No phone'}</div>
            <div className="flex items-center gap-2"><MapPin size={15} className="text-gray-400" /> {emp.location_name || 'No location'}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <Tabs.Root defaultValue="overview" className="flex flex-col">
          <Tabs.List className="flex border-b border-gray-200 px-2 overflow-x-auto hide-scrollbar">
            {[
              { id: 'overview', icon: Shield, label: 'Overview' },
              { id: 'personal', icon: User, label: 'Personal' },
              { id: 'work', icon: Briefcase, label: 'Work Info' },
              { id: 'statutory', icon: CreditCard, label: 'Statutory' },
              { id: 'documents', icon: FileText, label: 'Documents' },
              { id: 'timeline', icon: History, label: 'Timeline' },
            ].map(t => (
              <Tabs.Trigger
                key={t.id}
                value={t.id}
                className="px-4 py-3.5 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap outline-none"
              >
                <t.icon size={15} /> {t.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <div className="p-6">
            <Tabs.Content value="overview" className="outline-none space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Briefcase size={14}/> Current Role</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                    <InfoRow label="Department" value={emp.department_name} />
                    <InfoRow label="Designation" value={emp.designation_name} />
                    <InfoRow label="Reporting To" value={emp.manager_name} />
                    <InfoRow label="Location" value={emp.location_name} />
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Calendar size={14}/> Tenure</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-1">
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
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">Basic Details</h3>
                  <div className="space-y-1">
                    <InfoRow label="Date of Birth" value={emp.personal?.date_of_birth} />
                    <InfoRow label="Gender" value={emp.personal?.gender} />
                    <InfoRow label="Blood Group" value={emp.personal?.blood_group} />
                    <InfoRow label="Marital Status" value={emp.personal?.marital_status} />
                    <InfoRow label="Nationality" value={emp.nationality} />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">Contact Info</h3>
                  <div className="space-y-1">
                    <InfoRow label="Personal Email" value={emp.personal?.personal_email} />
                    <InfoRow label="Phone Number" value={emp.personal?.phone_number} />
                    <InfoRow label="Emergency Contact" value={emp.personal?.emergency_contact_name} />
                    <InfoRow label="Emergency Phone" value={emp.personal?.emergency_contact_number} />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">Addresses</h3>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Current Address</p>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{emp.personal?.current_address || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Permanent Address</p>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{emp.personal?.permanent_address || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Tabs.Content>

            <Tabs.Content value="work" className="outline-none">
              <div className="max-w-2xl">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">Employment Information</h3>
                <div className="space-y-1">
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
                <h3 className="text-sm font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">Statutory & Bank Details</h3>
                {!hasScope('SALARY_ACCESS') && emp.id !== employeeId ? (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500 text-sm">
                    <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    You do not have permission to view statutory and bank details for this employee.
                  </div>
                ) : !emp.statutory ? (
                   <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500 text-sm">
                    No statutory details recorded.
                  </div>
                ) : (
                  <div className="space-y-1">
                    <InfoRow label="PAN Number" value={<span className="font-mono uppercase">{emp.statutory.pan_number}</span>} />
                    <InfoRow label="Aadhaar Number" value={<span className="font-mono">{emp.statutory.aadhaar_number}</span>} />
                    <InfoRow label="UAN Number" value={<span className="font-mono">{emp.statutory.uan_number}</span>} />
                    <InfoRow label="PF Number" value={<span className="font-mono uppercase">{emp.statutory.pf_number}</span>} />
                    <InfoRow label="ESIC Number" value={<span className="font-mono">{emp.statutory.esic_number}</span>} />
                    <div className="my-4" />
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 pt-4 border-t border-gray-100">Bank Information</h4>
                    <InfoRow label="Bank Name" value={emp.statutory.bank_name} />
                    <InfoRow label="Account Number" value={<span className="font-mono">{emp.statutory.bank_account_number}</span>} />
                    <InfoRow label="IFSC Code" value={<span className="font-mono uppercase">{emp.statutory.ifsc_code}</span>} />
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
                <h3 className="text-sm font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-2">Employee Lifecycle</h3>
                <EmployeeTimeline employeeId={employeeId} />
              </div>
            </Tabs.Content>
          </div>
        </Tabs.Root>
      </div>
    </div>
  )
}

const EmployeeTimeline = ({ employeeId }: { employeeId: string }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['timeline', employeeId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/lifecycle/employees/${employeeId}/timeline`)
      if (!res.ok) throw new Error('Failed to fetch timeline')
      return res.json()
    }
  })

  if (isLoading) return <div className="text-sm text-gray-500 py-4">Loading timeline...</div>
  if (isError) return <div className="text-sm text-red-500 py-4">Failed to load timeline.</div>

  const events = data?.data || []

  if (events.length === 0) {
    return <div className="text-sm text-gray-500 py-4">No lifecycle events recorded.</div>
  }

  return (
    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
      {events.map((evt: any) => (
        <div key={evt.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-100 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
            <History size={16} />
          </div>
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="font-bold text-gray-900 text-sm">{evt.event_type.replace('_', ' ')}</div>
              <div className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{evt.effective_date}</div>
            </div>
            {evt.reason && <p className="text-xs text-gray-500 mt-1">{evt.reason}</p>}
            {evt.new_value && Object.keys(evt.new_value).length > 0 && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs border border-gray-100">
                {Object.entries(evt.new_value).map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="text-gray-400 capitalize">{k.replace('_', ' ')}:</span>
                    <span className="font-medium text-gray-700">{String(v)}</span>
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
      const res = await fetch(`/api/v1/documents/employees/${employeeId}`)
      if (!res.ok) throw new Error('Failed to fetch documents')
      return res.json()
    }
  })

  const verifyDoc = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/documents/${id}/verify`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Failed to verify document')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee-docs', employeeId] })
  })

  if (isLoading) return <div className="py-8 text-gray-500">Loading documents...</div>

  const docs = data?.data || []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-2">
        <h3 className="text-sm font-semibold text-gray-900">Document Library</h3>
        <button className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
          <Upload size={14} /> Upload Document
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {docs.map((doc: any) => (
          <div key={doc.id} className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText size={16}/></div>
                  <div>
                    <div className="font-medium text-gray-900">{doc.document_type_name}</div>
                    <div className="text-xs text-gray-400">{doc.file_name}</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  doc.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                  doc.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {doc.status}
                </span>
              </div>
              {doc.rejection_reason && (
                <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">
                  <span className="font-semibold">Reason:</span> {doc.rejection_reason}
                </div>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
              <div className="text-xs text-gray-400">Uploaded {doc.uploaded_at}</div>
              {doc.status === 'SUBMITTED' && (
                <button 
                  disabled={verifyDoc.isPending}
                  onClick={() => verifyDoc.mutate(doc.id)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  Verify Now
                </button>
              )}
            </div>
          </div>
        ))}
        {docs.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 border-2 border-dashed border-gray-100 rounded-xl">
            No documents uploaded yet.
          </div>
        )}
      </div>
    </div>
  )
}
