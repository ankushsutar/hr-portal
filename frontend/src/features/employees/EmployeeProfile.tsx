import { useQuery } from '@tanstack/react-query'
import * as Tabs from '@radix-ui/react-tabs'
import { User, Briefcase, FileText, History, Mail, Phone, MapPin } from 'lucide-react'

const fetchEmployee = async (id: string) => {
  const res = await fetch(`http://localhost:8080/api/v1/employees/${id}`)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export const EmployeeProfile = ({ employeeId }: { employeeId: string }) => {
  const { data, isLoading } = useQuery({ 
    queryKey: ['employee', employeeId], 
    queryFn: () => fetchEmployee(employeeId) 
  })

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>

  const emp = data?.data

  return (
    <div className="flex flex-col gap-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-start gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-500 to-blue-600 opacity-10"></div>
        <div className="relative z-10">
          <div className="h-24 w-24 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-3xl border-4 border-white shadow-sm">
            {emp?.first_name?.[0]}{emp?.last_name?.[0]}
          </div>
        </div>
        <div className="relative z-10 pt-2 flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{emp?.first_name} {emp?.last_name}</h1>
              <p className="text-gray-500 font-medium">Software Engineer • Engineering</p>
            </div>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200 shadow-sm">
              {emp?.status}
            </span>
          </div>
          <div className="mt-4 flex gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /> john.doe@company.com</div>
            <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /> +91 98765 43210</div>
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" /> Mumbai, India</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <Tabs.Root defaultValue="personal" className="flex flex-col">
          <Tabs.List className="flex border-b border-gray-200 px-2 overflow-x-auto">
            <Tabs.Trigger value="personal" className="px-4 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 transition-colors flex items-center gap-2 whitespace-nowrap">
              <User className="w-4 h-4" /> Personal
            </Tabs.Trigger>
            <Tabs.Trigger value="employment" className="px-4 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 transition-colors flex items-center gap-2 whitespace-nowrap">
              <Briefcase className="w-4 h-4" /> Employment
            </Tabs.Trigger>
            <Tabs.Trigger value="documents" className="px-4 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 transition-colors flex items-center gap-2 whitespace-nowrap">
              <FileText className="w-4 h-4" /> Documents
            </Tabs.Trigger>
            <Tabs.Trigger value="history" className="px-4 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 transition-colors flex items-center gap-2 whitespace-nowrap">
              <History className="w-4 h-4" /> History
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="personal" className="p-6 outline-none">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div><p className="text-sm text-gray-500">Date of Birth</p><p className="font-medium text-gray-900">1990-05-15</p></div>
              <div><p className="text-sm text-gray-500">Gender</p><p className="font-medium text-gray-900">Male</p></div>
              <div><p className="text-sm text-gray-500">Blood Group</p><p className="font-medium text-gray-900">O+</p></div>
              <div><p className="text-sm text-gray-500">Marital Status</p><p className="font-medium text-gray-900">Single</p></div>
            </div>
          </Tabs.Content>
          <Tabs.Content value="employment" className="p-6 outline-none">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Employment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div><p className="text-sm text-gray-500">Employee ID</p><p className="font-medium text-gray-900 font-mono">{emp?.employee_id}</p></div>
              <div><p className="text-sm text-gray-500">Joining Date</p><p className="font-medium text-gray-900">{emp?.joining_date}</p></div>
            </div>
          </Tabs.Content>
          <Tabs.Content value="documents" className="p-6 outline-none">
             <div className="text-sm text-gray-500">Documents will be listed here.</div>
          </Tabs.Content>
          <Tabs.Content value="history" className="p-6 outline-none">
             <div className="text-sm text-gray-500">Audit history will be listed here.</div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  )
}
