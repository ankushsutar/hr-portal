import { useQuery } from '@tanstack/react-query'
import { MapPin, Briefcase } from 'lucide-react'
import * as Tabs from '@radix-ui/react-tabs'
import { Card } from '../../components/ui/Card'

const fetchLocations = async () => {
  const token = localStorage.getItem('hrms_token') || localStorage.getItem('token')
  const res = await fetch('/api/v1/organization/locations', {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

const fetchDesignations = async () => {
  const token = localStorage.getItem('hrms_token') || localStorage.getItem('token')
  const res = await fetch('/api/v1/employees/designations', {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export const OrganizationList = () => {
  const { data: locData, isLoading: locLoading } = useQuery({ queryKey: ['locations'], queryFn: fetchLocations })
  const { data: desData, isLoading: desLoading } = useQuery({ queryKey: ['designations'], queryFn: fetchDesignations })

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div>
        <h1 className="text-[28px] font-bold text-slate-100 leading-tight tracking-tight">Organization Master Tables</h1>
        <p className="text-xs font-mono text-slate-400 mt-1">LOCATIONS, DESIGNATION CATALOGS & DEPARTMENTAL METRICS</p>
      </div>

      <Card className="p-0 overflow-hidden">
        <Tabs.Root defaultValue="locations" className="flex flex-col">
          <Tabs.List className="flex border-b border-slate-800 px-4 bg-slate-900/60 font-mono text-xs">
            <Tabs.Trigger
              value="locations"
              className="px-4 py-3 font-medium text-slate-400 hover:text-slate-200 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-400 transition-colors flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" /> Locations
            </Tabs.Trigger>
            <Tabs.Trigger
              value="designations"
              className="px-4 py-3 font-medium text-slate-400 hover:text-slate-200 border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-400 transition-colors flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4" /> Designations
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="locations" className="p-0 outline-none">
            {locLoading ? (
              <div className="p-6 font-mono text-xs text-slate-500">Loading locations...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="text-slate-400 uppercase bg-slate-900/60 border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-2.5">Name</th>
                      <th className="px-5 py-2.5">City</th>
                      <th className="px-5 py-2.5">Country</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {locData?.data?.map((loc: any) => (
                      <tr key={loc.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3 font-semibold text-slate-200">{loc.name}</td>
                        <td className="px-5 py-3 text-slate-400">{loc.city}</td>
                        <td className="px-5 py-3 text-slate-400">{loc.country}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Tabs.Content>

          <Tabs.Content value="designations" className="p-0 outline-none">
            {desLoading ? (
              <div className="p-6 font-mono text-xs text-slate-500">Loading designations...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="text-slate-400 uppercase bg-slate-900/60 border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-2.5">Name</th>
                      <th className="px-5 py-2.5">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {desData?.data?.map((des: any) => (
                      <tr key={des.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3 font-semibold text-slate-200">{des.name}</td>
                        <td className="px-5 py-3 text-slate-400">{des.grade || des.level_grade || 'GRADED'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Tabs.Content>
        </Tabs.Root>
      </Card>
    </div>
  )
}
