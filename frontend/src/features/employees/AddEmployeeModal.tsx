import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Loader2, X, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Card } from '../../components/ui/Card'

interface AddEmployeeModalProps {
  onClose: () => void
  onSuccess: () => void
}

export const AddEmployeeModal = ({ onClose, onSuccess }: AddEmployeeModalProps) => {
  const { hasRole } = useAuth()
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    work_email: '',
    employment_type: 'PERMANENT',
    joining_date: new Date().toISOString().split('T')[0],
    department_id: '',
    designation_id: '',
    location_id: '',
    gender: '',
    date_of_birth: '',
    phone_number: '',
  })

  const { data: deptsData } = useQuery({ queryKey: ['departments'], queryFn: () => fetch('/api/v1/organization/departments').then(r => r.json()) })
  const { data: desigsData } = useQuery({ queryKey: ['designations'], queryFn: () => fetch('/api/v1/employees/designations').then(r => r.json()) })
  const { data: locsData } = useQuery({ queryKey: ['locations'], queryFn: () => fetch('/api/v1/organization/locations').then(r => r.json()) })

  const departments = deptsData?.data ?? []
  const designations = desigsData?.data ?? []
  const locations = locsData?.data ?? []

  const mutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const cleaned = Object.fromEntries(Object.entries(payload).filter(([_, v]) => v !== ''))
      const res = await fetch('/api/v1/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleaned),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to create employee')
      return res.json()
    },
    onSuccess,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  if (!hasRole(['HR_ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'])) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-mono text-xs">
      <Card className="bg-[#111827] border-slate-800 w-full max-w-2xl p-0 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/60">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Add New Employee Profile</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">REGISTER A NEW EMPLOYEE RECORD IN THE CENTRAL REPOSITORY</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-200px)]">
          {mutation.isError && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded text-rose-400 text-xs">
              <AlertCircle size={14} className="shrink-0" />
              {mutation.error instanceof Error ? mutation.error.message : 'An error occurred'}
            </div>
          )}

          <div className="space-y-4">
            <section>
              <h3 className="text-[11px] font-bold text-slate-400 border-b border-slate-800 pb-1 mb-3 uppercase tracking-wider">Basic Demographics</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">First Name *</label>
                  <input required name="first_name" value={formData.first_name} onChange={handleChange} className="w-full px-3 py-1.5 bg-[#0B0F19] border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Last Name *</label>
                  <input required name="last_name" value={formData.last_name} onChange={handleChange} className="w-full px-3 py-1.5 bg-[#0B0F19] border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Corporate Email</label>
                  <input type="email" name="work_email" spellCheck={false} value={formData.work_email} onChange={handleChange} className="w-full px-3 py-1.5 bg-[#0B0F19] border border-slate-800 rounded text-slate-200 focus-visible:outline-none focus-visible:border-blue-500" placeholder="e.g. name@company.com" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Phone Contact</label>
                  <input name="phone_number" value={formData.phone_number} onChange={handleChange} className="w-full px-3 py-1.5 bg-[#0B0F19] border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-blue-500" />
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-[11px] font-bold text-slate-400 border-b border-slate-800 pb-1 mb-3 uppercase tracking-wider">Employment Assignment</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Joining Date *</label>
                  <input required type="date" name="joining_date" value={formData.joining_date} onChange={handleChange} className="w-full px-3 py-1.5 bg-[#0B0F19] border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Employment Type *</label>
                  <select required name="employment_type" value={formData.employment_type} onChange={handleChange} className="w-full px-3 py-1.5 bg-[#0B0F19] border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-blue-500">
                    <option value="PERMANENT">Permanent</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERN">Intern</option>
                    <option value="CONSULTANT">Consultant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Department</label>
                  <select name="department_id" value={formData.department_id} onChange={handleChange} className="w-full px-3 py-1.5 bg-[#0B0F19] border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-blue-500">
                    <option value="">Select Department</option>
                    {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Designation</label>
                  <select name="designation_id" value={formData.designation_id} onChange={handleChange} className="w-full px-3 py-1.5 bg-[#0B0F19] border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-blue-500">
                    <option value="">Select Designation</option>
                    {designations.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Workplace Location</label>
                  <select name="location_id" value={formData.location_id} onChange={handleChange} className="w-full px-3 py-1.5 bg-[#0B0F19] border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-blue-500">
                    <option value="">Select Location</option>
                    {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              </div>
            </section>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-3 py-1.5 bg-[#0B0F19] hover:bg-slate-800 border border-slate-800 text-slate-300 rounded font-semibold">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold disabled:opacity-50 flex items-center gap-2">
              {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Create Employee
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}
