import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Loader2, Plus, FileText, CheckCircle2 } from 'lucide-react'
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
    return <div className="p-8 text-red-500">Access Denied</div>
  }

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Onboarding Templates</h1>
          <p className="text-gray-500 mt-1">Configure automated workflows for new hires.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Create Template
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates?.data?.map((t: any) => (
            <Card key={t.id} className="p-6 border border-gray-100 hover:border-black/10 transition-colors shadow-sm bg-white/50 backdrop-blur-xl">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                  Standard
                </span>
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">{t.name}</h3>
              <p className="text-gray-500 text-sm line-clamp-2 mb-6">{t.description}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  0 Tasks Configured
                </div>
                <button className="text-sm font-medium text-black hover:underline">
                  Configure
                </button>
              </div>
            </Card>
          ))}
          {(!templates?.data || templates.data.length === 0) && (
             <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
               No templates found. Create one to get started.
             </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-md p-6 bg-white shadow-2xl animate-slide-up">
            <h3 className="text-xl font-bold mb-4">New Template</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                  placeholder="e.g. Engineering Standard Onboarding"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 resize-none"
                  placeholder="Template description..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={() => createTemplate.mutate({ name, description })}
                disabled={createTemplate.isPending || !name}
                className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center justify-center disabled:opacity-50"
              >
                {createTemplate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
