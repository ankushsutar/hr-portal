import { useQuery } from '@tanstack/react-query'
import { Briefcase, Users, Plus, ChevronRight } from 'lucide-react'
import { CandidatePipeline } from './CandidatePipeline'
import { Card } from '../../components/ui/Card'

const fetchJobs = async () => {
  const token = localStorage.getItem('hrms_token') || localStorage.getItem('token')
  const res = await fetch('/api/v1/recruitment/jobs', {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to fetch jobs')
  return res.json()
}

export const RecruitmentDashboard = () => {
  const { data: jobsData, isLoading: jobsLoading } = useQuery({ queryKey: ['activeJobs'], queryFn: fetchJobs })

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-slate-100 leading-tight tracking-tight">Applicant Tracking System (ATS)</h1>
          <p className="text-xs font-mono text-slate-400 mt-1">JOB REQUISITIONS & APPLICANT STAGE PIPELINE MANAGEMENT</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded font-mono text-xs font-semibold transition-colors shadow-sm">
          <Plus className="w-3.5 h-3.5" /> New Requisition
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Active Jobs Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-400" /> Active Job Requisitions
          </h3>
          <div className="space-y-3">
            {jobsLoading ? (
              <div className="text-xs font-mono text-slate-500">Loading requisitions...</div>
            ) : (
              jobsData?.data?.map((job: any) => (
                <Card key={job.id} className="p-3.5 hover:border-blue-500/50 cursor-pointer group">
                  <h4 className="font-semibold text-slate-200 text-xs group-hover:text-blue-400 transition-colors">{job.title}</h4>
                  <p className="text-[11px] font-mono text-slate-400 mt-1">{job.department} • {job.location}</p>
                  <div className="flex items-center justify-between mt-3 text-[11px] font-mono">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                      Target: {job.headcount}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Candidate Pipeline */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" /> Candidate Stage Funnel
            </h3>
          </div>
          <CandidatePipeline />
        </div>
      </div>
    </div>
  )
}
