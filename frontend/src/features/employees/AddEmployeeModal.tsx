import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Loader2, X, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

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

  // Fetch lookups (departments, designations, locations)
  const { data: deptsData } = useQuery({ queryKey: ['departments'], queryFn: () => fetch('/api/v1/organization/departments').then(r => r.json()) })
  const { data: desigsData } = useQuery({ queryKey: ['designations'], queryFn: () => fetch('/api/v1/employees/designations').then(r => r.json()) })
  const { data: locsData } = useQuery({ queryKey: ['locations'], queryFn: () => fetch('/api/v1/organization/locations').then(r => r.json()) })

  const departments = deptsData?.data ?? []
  const designations = desigsData?.data ?? []
  const locations = locsData?.data ?? []

  const mutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      // Clean up empty optional string fields to avoid passing empty strings when nil is better, but API handles it mostly.
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden mt-10 mb-10 relative">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50/50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add New Employee</h2>
            <p className="text-xs text-gray-500 mt-1">Create an employee profile. You can add more details later.</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          {mutation.isError && (
            <div className="mb-6 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle size={15} className="shrink-0" />
              {mutation.error instanceof Error ? mutation.error.message : 'An error occurred'}
            </div>
          )}

          <div className="space-y-6">
            <section>
              <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4 uppercase tracking-wider">Basic Info</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label>
                  <input required name="first_name" value={formData.first_name} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Last Name <span className="text-red-500">*</span></label>
                  <input required name="last_name" value={formData.last_name} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Work Email</label>
                  <input type="email" name="work_email" value={formData.work_email} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Personal Phone</label>
                  <input name="phone_number" value={formData.phone_number} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4 uppercase tracking-wider">Work Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Joining Date <span className="text-red-500">*</span></label>
                  <input required type="date" name="joining_date" value={formData.joining_date} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Employment Type <span className="text-red-500">*</span></label>
                  <select required name="employment_type" value={formData.employment_type} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:ring-2 focus:ring-blue-500/20">
                    <option value="PERMANENT">Permanent</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERN">Intern</option>
                    <option value="CONSULTANT">Consultant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                  <select name="department_id" value={formData.department_id} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:ring-2 focus:ring-blue-500/20">
                    <option value="">Select Department</option>
                    {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Designation</label>
                  <select name="designation_id" value={formData.designation_id} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:ring-2 focus:ring-blue-500/20">
                    <option value="">Select Designation</option>
                    {designations.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                  <select name="location_id" value={formData.location_id} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:ring-2 focus:ring-blue-500/20">
                    <option value="">Select Location</option>
                    {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-5 border-t border-gray-200 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors">
              {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Create Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
