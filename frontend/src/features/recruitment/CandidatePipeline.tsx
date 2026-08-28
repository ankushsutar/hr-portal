import { useQuery } from '@tanstack/react-query'
import { FileText, CheckCircle, Mail } from 'lucide-react'
import { Card } from '../../components/ui/Card'

const fetchCandidates = async () => {
  const token = localStorage.getItem('hrms_token') || localStorage.getItem('token')
  const res = await fetch('/api/v1/recruitment/candidates', {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to fetch candidates')
  return res.json()
}

export const CandidatePipeline = () => {
  const { data, isLoading } = useQuery({ queryKey: ['candidates'], queryFn: fetchCandidates })

  if (isLoading) return <div className="p-8 text-center font-mono text-xs text-slate-500">Loading candidates pipeline...</div>

  const candidates = data?.data || []
  
  const stages = [
    { id: 'APPLIED', label: 'Applied', color: 'border-blue-500/20 bg-blue-500/10 text-blue-400' },
    { id: 'INTERVIEWING', label: 'Interviewing', color: 'border-amber-500/20 bg-amber-500/10 text-amber-400' },
    { id: 'OFFERED', label: 'Offered', color: 'border-purple-500/20 bg-purple-500/10 text-purple-400' },
    { id: 'HIRED', label: 'Hired', color: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' }
  ]

  const generateOffer = async (candidateId: string) => {
    try {
      const token = localStorage.getItem('hrms_token') || localStorage.getItem('token')
      const res = await fetch('/api/v1/recruitment/offers', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ candidate_id: candidateId, salary_offered: 1500000 })
      })
      if (res.ok) {
        alert("Offer generated and onboarding workflow triggered successfully.")
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 font-mono text-xs">
      {stages.map(stage => {
        const stageCandidates = candidates.filter((c: any) => c.status === stage.id)
        return (
          <div key={stage.id} className="min-w-[280px] flex-1 bg-[#111827] rounded-lg border border-slate-800 p-4 flex flex-col h-[600px]">
            <div className={`px-3 py-1.5 rounded border font-semibold text-xs mb-3 ${stage.color} flex justify-between items-center uppercase tracking-wider`}>
              <span>{stage.label}</span>
              <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-700 text-slate-200">{stageCandidates.length}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {stageCandidates.map((c: any) => (
                <Card key={c.id} className="p-3.5 hover:border-slate-700 cursor-pointer group">
                  <h4 className="font-semibold text-slate-100 text-xs">{c.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{c.role}</p>
                  
                  <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-2.5">
                    <div className="flex gap-2">
                      <button className="text-slate-400 hover:text-blue-400 transition-colors" title="Resume">
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                      <button className="text-slate-400 hover:text-blue-400 transition-colors" title="Email">
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {stage.id === 'INTERVIEWING' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); generateOffer(c.id); }}
                        className="text-[10px] font-bold uppercase text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded"
                      >
                        Make Offer
                      </button>
                    )}
                    {stage.id === 'HIRED' && (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                </Card>
              ))}
              {stageCandidates.length === 0 && (
                <div className="text-center text-xs text-slate-500 py-8 border border-dashed border-slate-800 rounded">
                  No candidates in this stage
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
