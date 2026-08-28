import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Loader2, Plus, FileText, X, ShieldAlert } from 'lucide-react'
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
    return (
      <div className="p-8 font-mono text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2">
        <ShieldAlert size={16} /> Access Denied: Administrator Privilege Required
      </div>
    )
  }

  const types = data?.data || []

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-slate-100 leading-tight tracking-tight">Compliance Document Types</h1>
          <p className="text-xs font-mono text-slate-400 mt-1">CONFIGURE REQUIRED EMPLOYEE DOCUMENTATION & ACCESS SCOPES</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-mono font-medium transition-colors shadow-sm"
        >
          <Plus size={14} />
          Create Document Type
        </button>
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-xs font-mono text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading document rules...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800 font-mono text-xs text-slate-400 uppercase">
                  <th className="px-5 py-2.5">Document Name</th>
                  <th className="px-5 py-2.5">Compliance Rules</th>
                  <th className="px-5 py-2.5">Access Scope</th>
                  <th className="px-5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {types.map((dt: any) => (
                  <tr key={dt.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3 flex items-center gap-3">
                      <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">
                        <FileText size={14}/>
                      </div>
                      <span className="font-semibold text-slate-200">{dt.name}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {dt.is_mandatory && <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] uppercase font-bold rounded">Mandatory</span>}
                        {dt.has_expiry && <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] uppercase font-bold rounded">Expires</span>}
                        {dt.requires_verification && <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] uppercase font-bold rounded">Requires Audit</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-bold rounded">{dt.access_scope}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button className="text-xs font-mono text-blue-400 hover:text-blue-300">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {types.length === 0 && (
              <div className="p-10 text-center font-mono text-xs text-slate-500">No document types configured.</div>
            )}
          </div>
        )}
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-mono">
          <Card className="w-full max-w-md bg-[#111827] border-slate-800 p-0 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/60">
              <h3 className="text-sm font-semibold text-slate-100">New Document Type</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-300"><X size={16}/></button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Document Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full px-3 py-1.5 bg-[#0B0F19] border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-blue-500" 
                  placeholder="e.g. Relieving Letter" 
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={isMandatory} onChange={e => setIsMandatory(e.target.checked)} className="rounded bg-[#0B0F19] border-slate-800 text-blue-600"/> Mandatory Document
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={hasExpiry} onChange={e => setHasExpiry(e.target.checked)} className="rounded bg-[#0B0F19] border-slate-800 text-blue-600"/> Has Expiry Date
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={requiresVerification} onChange={e => setRequiresVerification(e.target.checked)} className="rounded bg-[#0B0F19] border-slate-800 text-blue-600"/> Requires HR Verification
                </label>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Access Scope</label>
                <select 
                  value={accessScope} 
                  onChange={e => setAccessScope(e.target.value)} 
                  className="w-full px-3 py-1.5 bg-[#0B0F19] border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="HR">HR Only</option>
                  <option value="PAYROLL">Payroll & HR</option>
                  <option value="ALL">Everyone</option>
                </select>
              </div>
            </div>
            <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-900/60 flex gap-3 text-xs">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 px-3 py-1.5 bg-[#0B0F19] hover:bg-slate-800 border border-slate-800 text-slate-300 rounded">Cancel</button>
              <button 
                onClick={() => createMutation.mutate({ name, is_mandatory: isMandatory, has_expiry: hasExpiry, requires_verification: requiresVerification, access_scope: accessScope })}
                disabled={createMutation.isPending || !name}
                className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {createMutation.isPending && <Loader2 size={14} className="animate-spin" />} Create
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
