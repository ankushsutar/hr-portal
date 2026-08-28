import { useQuery } from '@tanstack/react-query'
import { FileText, CheckCircle, Mail } from 'lucide-react'

const fetchCandidates = async () => {
  const res = await fetch('http://localhost:8080/api/v1/recruitment/candidates')
  if (!res.ok) throw new Error('Failed to fetch candidates')
  return res.json()
}

export const CandidatePipeline = () => {
  const { data, isLoading } = useQuery({ queryKey: ['candidates'], queryFn: fetchCandidates })

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading candidates...</div>

  const candidates = data?.data || []
  
  const stages = [
    { id: 'APPLIED', label: 'Applied', color: 'border-blue-200 bg-blue-50' },
    { id: 'INTERVIEWING', label: 'Interviewing', color: 'border-yellow-200 bg-yellow-50' },
    { id: 'OFFERED', label: 'Offered', color: 'border-purple-200 bg-purple-50' },
    { id: 'HIRED', label: 'Hired', color: 'border-green-200 bg-green-50' }
  ]

  const generateOffer = async (candidateId: string) => {
    try {
      const res = await fetch('http://localhost:8080/api/v1/recruitment/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_id: candidateId, salary_offered: 1500000 })
      })
      if (res.ok) {
        alert("Offer generated and workflow triggered successfully.")
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map(stage => {
        const stageCandidates = candidates.filter((c: any) => c.status === stage.id)
        return (
          <div key={stage.id} className="min-w-[280px] flex-1 bg-gray-50 rounded-xl border border-gray-200 p-4 flex flex-col h-[600px]">
            <div className={`px-3 py-1.5 rounded-lg border font-semibold text-sm mb-4 ${stage.color} flex justify-between items-center`}>
              <span>{stage.label}</span>
              <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs">{stageCandidates.length}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {stageCandidates.map((c: any) => (
                <div key={c.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-indigo-300 transition-colors cursor-pointer group">
                  <h4 className="font-semibold text-gray-900">{c.name}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{c.role}</p>
                  
                  <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3">
                    <div className="flex gap-2">
                      <button className="text-gray-400 hover:text-indigo-600 transition-colors" title="Resume">
                        <FileText className="w-4 h-4" />
                      </button>
                      <button className="text-gray-400 hover:text-indigo-600 transition-colors" title="Email">
                        <Mail className="w-4 h-4" />
                      </button>
                    </div>
                    {stage.id === 'INTERVIEWING' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); generateOffer(c.id); }}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded"
                      >
                        Make Offer
                      </button>
                    )}
                    {stage.id === 'HIRED' && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                </div>
              ))}
              {stageCandidates.length === 0 && (
                <div className="text-center text-sm text-gray-400 py-8 border-2 border-dashed border-gray-200 rounded-lg">
                  No candidates
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
