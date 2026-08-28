import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Building2, Loader2, X, AlertCircle } from 'lucide-react'
import { useState } from 'react'

export const Designations = () => {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [grade, setGrade] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['designations'],
    queryFn: async () => {
      const res = await fetch('/api/v1/employees/designations')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    }
  })

  const addMutation = useMutation({
    mutationFn: async () => {
      const payload = { name, grade: grade || undefined, organization_id: '11111111-1111-1111-1111-111111111111' } // Mock org ID for now
      const res = await fetch('/api/v1/employees/designations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to add')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['designations'] })
      setShowAdd(false)
      setName('')
      setGrade('')
    }
  })

  const designations = data?.data ?? []

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Designations</h1>
          <p className="text-sm text-gray-500 mt-1">Manage job titles and grades across the organization.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          <Plus size={15} /> Add Designation
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/60 border-b border-gray-100">
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Designation Name</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Grade Level</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={3} className="p-6 text-center text-sm text-gray-500">Loading...</td></tr>
            ) : designations.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-12 text-center">
                  <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm font-medium">No designations found</p>
                </td>
              </tr>
            ) : (
              designations.map((d: any) => (
                <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{d.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">{d.grade || '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Add Designation</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); addMutation.mutate() }} className="p-6 space-y-4">
              {addMutation.isError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle size={15} /> Failed to add designation
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation Name <span className="text-red-500">*</span></label>
                <input required value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500/20" placeholder="e.g. Senior Software Engineer" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level (Optional)</label>
                <input value={grade} onChange={e => setGrade(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500/20" placeholder="e.g. L4, E2" />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 font-medium">Cancel</button>
                <button type="submit" disabled={addMutation.isPending || !name} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                  {addMutation.isPending && <Loader2 size={14} className="animate-spin" />} Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
