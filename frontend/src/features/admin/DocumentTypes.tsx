import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Loader2, Plus, FileText, X } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { useAuth } from '../../contexts/AuthContext'

export const DocumentTypes = () => {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [isMandatory, setIsMandatory] = useState(true)
  const [hasExpiry, setHasExpiry] = useState(false)
  const [requiresVerification, setRequiresVerification] = useState(true)
  const [accessScope, setAccessScope] = useState('HR')

  const { data, isLoading } = useQuery({
    queryKey: ['document-types'],
    queryFn: async () => {
      const res = await fetch('/api/v1/documents/types', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to fetch document types')
      return res.json()
    }
  })

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/v1/documents/types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to create document type')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['document-types'] })
      setIsModalOpen(false)
      setName('')
    }
  })

  if (!['SUPER_ADMIN', 'HR_ADMIN'].includes(user?.roles?.[0] || '')) {
    return <div className="p-8 text-red-500">Access Denied</div>
  }

  const types = data?.data || []

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Document Types</h1>
          <p className="text-gray-500 mt-1">Configure required employee documents and access scopes.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Create Type
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-100">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Document Name</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Settings</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Access Scope</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {types.map((dt: any) => (
                <tr key={dt.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText size={16}/></div>
                    <span className="font-medium text-gray-900">{dt.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {dt.is_mandatory && <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] uppercase font-bold rounded">Mandatory</span>}
                      {dt.has_expiry && <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] uppercase font-bold rounded">Expires</span>}
                      {dt.requires_verification && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] uppercase font-bold rounded">Requires Verification</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">{dt.access_scope}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-sm font-medium text-blue-600 hover:text-blue-800">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {types.length === 0 && (
            <div className="p-12 text-center text-gray-500">No document types configured.</div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-md bg-white shadow-2xl rounded-2xl overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">New Document Type</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5" placeholder="e.g. Relieving Letter" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={isMandatory} onChange={e => setIsMandatory(e.target.checked)} className="rounded text-blue-600"/> Mandatory
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={hasExpiry} onChange={e => setHasExpiry(e.target.checked)} className="rounded text-blue-600"/> Has Expiry Date
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={requiresVerification} onChange={e => setRequiresVerification(e.target.checked)} className="rounded text-blue-600"/> Requires Verification
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Access Scope</label>
                <select value={accessScope} onChange={e => setAccessScope(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5">
                  <option value="HR">HR Only</option>
                  <option value="PAYROLL">Payroll & HR</option>
                  <option value="ALL">Everyone</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-white">Cancel</button>
              <button 
                onClick={() => createMutation.mutate({ name, is_mandatory: isMandatory, has_expiry: hasExpiry, requires_verification: requiresVerification, access_scope: accessScope })}
                disabled={createMutation.isPending || !name}
                className="flex-1 px-4 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {createMutation.isPending && <Loader2 size={16} className="animate-spin" />} Create
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
