import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Loader2, Plus, FileText, CheckCircle2, ShieldAlert, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Card } from '../../components/ui/Card'

export const OnboardingTemplates = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const { data: templates, isLoading } = useQuery({
    queryKey: ['onboarding-templates'],
    queryFn: async () => {
      const res = await fetch('/api/v1/onboarding/templates', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to fetch templates')
      return res.json()
    }
  })

  const createTemplate = useMutation({
    mutationFn: async (payload: { name: string, description: string }) => {
      const res = await fetch('/api/v1/onboarding/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to create template')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-templates'] })
      setIsModalOpen(false)
      setName('')
      setDescription('')
    }
  })

  if (!['SUPER_ADMIN', 'HR_ADMIN'].includes(user?.roles?.[0] || '')) {
    return (
      <div className="p-8 font-mono text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2">
        <ShieldAlert size={16} /> Access Denied: Administrator Privilege Required
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-slate-100 leading-tight tracking-tight">Onboarding Templates</h1>
          <p className="text-xs font-mono text-slate-400 mt-1">CONFIGURE AUTOMATED WORKFLOW TEMPLATES FOR NEW HIRES</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-mono font-medium transition-colors shadow-sm"
        >
          <Plus size={14} />
          Create Template
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12 text-xs font-mono text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading templates...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates?.data?.map((t: any) => (
            <Card key={t.id} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-8 h-8 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700 rounded">
                    STANDARD
                  </span>
                </div>
                <h3 className="font-semibold text-slate-100 text-sm mb-1">{t.name}</h3>
                <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mb-4 font-mono">{t.description || 'Standard onboarding task workflow template.'}</p>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-slate-800 font-mono text-xs">
                <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  0 Tasks Configured
                </div>
                <button className="text-xs font-mono text-blue-400 hover:text-blue-300">
                  Configure
                </button>
              </div>
            </Card>
          ))}
          {(!templates?.data || templates.data.length === 0) && (
            <div className="col-span-full py-12 text-center text-xs font-mono text-slate-500 bg-[#111827] rounded-lg border border-slate-800">
              No onboarding templates found. Create one to get started.
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-mono">
          <Card className="w-full max-w-md bg-[#111827] border-slate-800 p-0 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/60">
              <h3 className="text-sm font-semibold text-slate-100">New Onboarding Template</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-300"><X size={16}/></button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Template Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#0B0F19] border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Engineering Onboarding Plan"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-1.5 bg-[#0B0F19] border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-blue-500"
                  placeholder="Summary of onboarding tasks included..."
                />
              </div>
            </div>
            <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-900/60 flex gap-3 text-xs">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-3 py-1.5 bg-[#0B0F19] hover:bg-slate-800 border border-slate-800 text-slate-300 rounded"
              >
                Cancel
              </button>
              <button 
                onClick={() => createTemplate.mutate({ name, description })}
                disabled={createTemplate.isPending || !name}
                className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {createTemplate.isPending && <Loader2 size={14} className="animate-spin" />}
                Create Template
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
