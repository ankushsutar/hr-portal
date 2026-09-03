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
        <h1 className="text-[28px] font-bold text-[var(--text-main)] leading-tight tracking-tight">Organization Master Tables</h1>
        <p className="text-xs font-mono text-[var(--text-muted)] mt-1">LOCATIONS, DESIGNATION CATALOGS & DEPARTMENTAL METRICS</p>
      </div>

      <Card className="p-0 overflow-hidden bg-[var(--bg-card)] border-[var(--border-color)]">
        <Tabs.Root defaultValue="locations" className="flex flex-col">
          <Tabs.List className="flex border-b border-[var(--border-color)] px-4 bg-[var(--bg-subtle)] font-mono text-xs">
            <Tabs.Trigger
              value="locations"
              className="px-4 py-3 font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] border-b-2 border-transparent data-[state=active]:border-[var(--color-primary)] data-[state=active]:theme-accent-text transition-colors flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" /> Locations
            </Tabs.Trigger>
            <Tabs.Trigger
              value="designations"
              className="px-4 py-3 font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] border-b-2 border-transparent data-[state=active]:border-[var(--color-primary)] data-[state=active]:theme-accent-text transition-colors flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4" /> Designations
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="locations" className="p-0 outline-none">
            {locLoading ? (
              <div className="p-6 font-mono text-xs text-[var(--text-muted)]">Loading locations...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="text-[var(--text-muted)] uppercase bg-[var(--bg-subtle)]/60 border-b border-[var(--border-color)]">
                    <tr>
                      <th className="px-5 py-2.5">Name</th>
                      <th className="px-5 py-2.5">City</th>
                      <th className="px-5 py-2.5">Country</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-main)]">
                    {locData?.data?.map((loc: any) => (
                      <tr key={loc.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                        <td className="px-5 py-3 font-semibold text-[var(--text-main)]">{loc.name}</td>
                        <td className="px-5 py-3 text-[var(--text-muted)]">{loc.city}</td>
                        <td className="px-5 py-3 text-[var(--text-muted)]">{loc.country}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Tabs.Content>

          <Tabs.Content value="designations" className="p-0 outline-none">
            {desLoading ? (
              <div className="p-6 font-mono text-xs text-[var(--text-muted)]">Loading designations...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="text-[var(--text-muted)] uppercase bg-[var(--bg-subtle)]/60 border-b border-[var(--border-color)]">
                    <tr>
                      <th className="px-5 py-2.5">Name</th>
                      <th className="px-5 py-2.5">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-main)]">
                    {desData?.data?.map((des: any) => (
                      <tr key={des.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                        <td className="px-5 py-3 font-semibold text-[var(--text-main)]">{des.name}</td>
                        <td className="px-5 py-3 text-[var(--text-muted)]">{des.grade || des.level_grade || 'GRADED'}</td>
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
