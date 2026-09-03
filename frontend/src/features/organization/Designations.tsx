import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Building2, Loader2, X, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { Card } from '../../components/ui/Card'
import { apiFetch } from '../../lib/api'

export const Designations = () => {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [grade, setGrade] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['designations'],
    queryFn: async () => {
      const res = await apiFetch('/api/v1/employees/designations')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    }
  })

  const addMutation = useMutation({
    mutationFn: async () => {
      const payload = { name, grade: grade || undefined, organization_id: '11111111-1111-1111-1111-111111111111' }
      const res = await apiFetch('/api/v1/employees/designations', {
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
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[var(--text-main)] leading-tight tracking-tight">Job Designations & Grades</h1>
          <p className="text-xs font-mono text-[var(--text-muted)] mt-1">MANAGE OFFICIAL TITLES & CAREER LEVEL GRADINGS</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 theme-accent-bg hover:opacity-90 text-white rounded text-xs font-mono font-medium transition-colors shadow-sm"
        >
          <Plus size={14} /> Add Designation
        </button>
      </div>

      <Card className="p-0 overflow-hidden bg-[var(--bg-card)] border-[var(--border-color)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border-color)] font-mono text-xs text-[var(--text-muted)] uppercase">
                <th className="px-5 py-2.5">Designation Name</th>
                <th className="px-5 py-2.5">Grade Level</th>
                <th className="px-5 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] font-mono text-xs text-[var(--text-main)]">
              {isLoading ? (
                <tr><td colSpan={3} className="p-8 text-center text-[var(--text-muted)]">Loading designation catalog...</td></tr>
              ) : designations.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-10 text-center">
                    <Building2 className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
                    <p className="text-[var(--text-muted)] text-xs font-semibold">No designations configured.</p>
                  </td>
                </tr>
              ) : (
                designations.map((d: any) => (
                  <tr key={d.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                    <td className="px-5 py-3 font-semibold text-[var(--text-main)]">{d.name}</td>
                    <td className="px-5 py-3 text-[var(--text-muted)]">
                      <span className="px-2 py-0.5 bg-[var(--bg-subtle)] text-[var(--text-main)] border border-[var(--border-color)] rounded text-[11px] font-bold">
                        {d.grade || 'GRADED'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button className="text-xs theme-accent-text hover:underline">Edit</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-mono">
          <Card className="w-full max-w-md bg-[var(--bg-card)] border-[var(--border-color)] p-0 overflow-hidden shadow-2xl text-[var(--text-main)]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-color)] bg-[var(--bg-subtle)]">
              <h2 className="text-sm font-semibold text-[var(--text-main)]">Add Designation</h2>
              <button onClick={() => setShowAdd(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); addMutation.mutate() }} className="p-5 space-y-4 text-xs">
              {addMutation.isError && (
                <div className="flex items-center gap-2 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded text-rose-500">
                  <AlertCircle size={14} /> Failed to add designation
                </div>
              )}
              <div>
                <label className="block text-[var(--text-muted)] mb-1">Designation Name *</label>
                <input 
                  required 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded text-[var(--text-main)] focus:outline-none focus:border-[var(--color-primary)]" 
                  placeholder="e.g. Senior Software Engineer" 
                />
              </div>
              <div>
                <label className="block text-[var(--text-muted)] mb-1">Grade Level (Optional)</label>
                <input 
                  value={grade} 
                  onChange={e => setGrade(e.target.value)} 
                  className="w-full px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded text-[var(--text-main)] focus:outline-none focus:border-[var(--color-primary)]" 
                  placeholder="e.g. L4, E2" 
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-1.5 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] rounded">
                  Cancel
                </button>
                <button type="submit" disabled={addMutation.isPending || !name} className="px-3 py-1.5 theme-accent-bg hover:opacity-90 text-white rounded disabled:opacity-50 flex items-center gap-2 font-semibold shadow-sm">
                  {addMutation.isPending && <Loader2 size={14} className="animate-spin" />} Save
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
