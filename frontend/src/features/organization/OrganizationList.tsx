import { useQuery } from '@tanstack/react-query'
import { Building2, MapPin, Briefcase } from 'lucide-react'
import * as Tabs from '@radix-ui/react-tabs'

const fetchLocations = async () => {
  const res = await fetch('http://localhost:8080/api/v1/organization/locations')
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

const fetchDesignations = async () => {
  const res = await fetch('http://localhost:8080/api/v1/organization/designations')
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export const OrganizationList = () => {
  const { data: locData, isLoading: locLoading } = useQuery({ queryKey: ['locations'], queryFn: fetchLocations })
  const { data: desData, isLoading: desLoading } = useQuery({ queryKey: ['designations'], queryFn: fetchDesignations })

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Organization Settings</h2>
          <p className="text-sm text-gray-500 mt-1">Manage locations, departments, and designations.</p>
        </div>
      </div>

      <Tabs.Root defaultValue="locations" className="flex flex-col">
        <Tabs.List className="flex border-b border-gray-200 px-6">
          <Tabs.Trigger
            value="locations"
            className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 transition-colors flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" /> Locations
          </Tabs.Trigger>
          <Tabs.Trigger
            value="designations"
            className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 transition-colors flex items-center gap-2"
          >
            <Briefcase className="w-4 h-4" /> Designations
          </Tabs.Trigger>
          <Tabs.Trigger
            value="departments"
            className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 transition-colors flex items-center gap-2"
          >
            <Building2 className="w-4 h-4" /> Departments
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="locations" className="p-6 outline-none">
          {locLoading ? (
            <div className="text-sm text-gray-500">Loading locations...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">City</th>
                    <th className="px-4 py-3">Country</th>
                  </tr>
                </thead>
                <tbody>
                  {locData?.data?.map((loc: any) => (
                    <tr key={loc.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{loc.name}</td>
                      <td className="px-4 py-3">{loc.city}</td>
                      <td className="px-4 py-3">{loc.country}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Tabs.Content>

        <Tabs.Content value="designations" className="p-6 outline-none">
          {desLoading ? (
            <div className="text-sm text-gray-500">Loading designations...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {desData?.data?.map((des: any) => (
                    <tr key={des.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{des.name}</td>
                      <td className="px-4 py-3">{des.level_grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
