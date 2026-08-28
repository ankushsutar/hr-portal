import { useQuery } from '@tanstack/react-query'
import { Briefcase, Users, Plus, ChevronRight } from 'lucide-react'
import { CandidatePipeline } from './CandidatePipeline'

const fetchJobs = async () => {
  const res = await fetch('http://localhost:8080/api/v1/recruitment/jobs')
  if (!res.ok) throw new Error('Failed to fetch jobs')
  return res.json()
}

export const RecruitmentDashboard = () => {
  const { data: jobsData, isLoading: jobsLoading } = useQuery({ queryKey: ['activeJobs'], queryFn: fetchJobs })

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center border-b border-gray-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recruitment (ATS)</h2>
          <p className="text-gray-500 mt-1">Manage job requisitions and applicant pipelines.</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold shadow-sm">
          <Plus className="w-4 h-4" /> New Requisition
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Active Jobs Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-500" /> Active Roles
          </h3>
          <div className="space-y-3">
            {jobsLoading ? (
              <div className="text-sm text-gray-500">Loading jobs...</div>
            ) : (
              jobsData?.data?.map((job: any) => (
                <div key={job.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-indigo-300 cursor-pointer transition-colors group">
                  <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600">{job.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{job.department} • {job.location}</p>
                  <div className="flex items-center justify-between mt-3 text-xs">
                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">Headcount: {job.headcount}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Candidate Pipeline */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" /> Candidate Pipeline
            </h3>
          </div>
          <CandidatePipeline />
        </div>
      </div>
    </div>
  )
}
