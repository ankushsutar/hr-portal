import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  Search, Plus, Download, RefreshCw, Users,
  Building2, Filter, X
} from 'lucide-react'
import { useState } from 'react'
import { AddEmployeeModal } from './AddEmployeeModal'
import { useAuth } from '../../contexts/AuthContext'
import { Card } from '../../components/ui/Card'
import { PaginationBar } from '../../components/ui/PaginationBar'
import { useTableState } from '../../hooks/useTableState'
import { apiFetch } from '../../lib/api'

interface Employee {
  id: string
  employee_id: string
  first_name: string
  last_name: string
  full_name: string
  work_email: string
  employment_type: string
  status: string
  joining_date: string
  department_name: string | null
  designation_name: string | null
  location_name: string | null
  manager_name: string | null
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:     'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  PROBATION:  'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  INACTIVE:   'bg-slate-800 text-slate-400 border border-slate-700',
  TERMINATED: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  RESIGNED:   'bg-orange-500/10 text-orange-400 border border-orange-500/20',
}

const TYPE_STYLES: Record<string, string> = {
  PERMANENT:  'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  CONTRACT:   'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  INTERN:     'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
  CONSULTANT: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
}

function initials(emp: Employee) {
  return `${emp.first_name[0] ?? ''}${emp.last_name[0] ?? ''}`.toUpperCase()
}

function avatarColor(name: string) {
  const colors = [
    'bg-blue-900/60 text-blue-300 border border-blue-700/50',
    'bg-indigo-900/60 text-indigo-300 border border-indigo-700/50',
    'bg-violet-900/60 text-violet-300 border border-violet-700/50',
    'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50',
    'bg-amber-900/60 text-amber-300 border border-amber-700/50',
    'bg-rose-900/60 text-rose-300 border border-rose-700/50',
    'bg-cyan-900/60 text-cyan-300 border border-cyan-700/50',
  ]
  return colors[name.charCodeAt(0) % colors.length]
}

export const EmployeeDirectory = () => {
  const { hasRole } = useAuth()
  const qc = useQueryClient()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showAdd, setShowAdd] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const {
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
    filters,
    setFilter,
    clearAllFilters,
    hasActiveFilters,
    queryParams,
  } = useTableState({ initialLimit: 10 })

  const { data, isLoading } = useQuery({
    queryKey: ['employees', queryParams.toString()],
    queryFn: async () => {
      const res = await apiFetch(`/api/v1/employees?${queryParams.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  const { data: statsData } = useQuery({
    queryKey: ['employee-stats'],
    queryFn: async () => {
      const res = await apiFetch('/api/v1/employees/stats')
      if (!res.ok) return null
      return res.json()
    },
  })

  const employees: Employee[] = data?.data ?? []
  const pagination = data?.pagination
  const totalCount = data?.total ?? employees.length
  const stats = statsData?.data

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === employees.length) setSelected(new Set())
    else setSelected(new Set(employees.map((e) => e.id)))
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 font-mono">Employee Directory</h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            {stats ? `${stats.total_active} active · ${stats.new_this_month} joined this month · ${stats.on_probation} on probation` : 'Loading stats...'}
          </p>
        </div>
        {hasRole(['HR_ADMIN', 'SUPER_ADMIN', 'HR_MANAGER']) && (
          <div className="flex items-center gap-2 font-mono">
            <a
              href="/api/v1/employees/export"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-700 text-slate-300 rounded hover:bg-slate-800 transition-colors"
            >
              <Download size={14} /> Export CSV
            </a>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded transition-colors shadow-sm"
            >
              <Plus size={14} /> Add Employee
            </button>
          </div>
        )}
      </div>

      {/* Stats strip */}
      {/* Summary KPI Strip */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
          {[
            { label: 'TOTAL ACTIVE', value: stats.total_active, icon: Users, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
            { label: 'NEW THIS MONTH', value: stats.new_this_month, icon: Plus, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
            { label: 'ON PROBATION', value: stats.on_probation, icon: Filter, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
            { label: 'PROBATION DUE', value: stats.probation_due_soon, icon: Building2, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
          ].map(s => (
            <Card key={s.label} className="p-3.5 flex items-center gap-3">
              <div className={`p-2 rounded border ${s.color}`}>
                <s.icon size={16} />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-100 font-mono">{s.value}</p>
                <p className="text-[10px] text-slate-400 uppercase">{s.label}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap font-mono text-xs">
        <div className="relative flex-1 min-w-[240px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, ID..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#0B0F19] border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-1.5 border rounded transition-colors ${showFilters || hasActiveFilters ? 'border-blue-500/50 text-blue-400 bg-blue-500/10' : 'border-slate-800 text-slate-400 bg-[#0B0F19] hover:bg-slate-800'}`}
        >
          <Filter size={13} /> Filters
          {hasActiveFilters && <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />}
        </button>

        {hasActiveFilters && (
          <button onClick={clearAllFilters} className="flex items-center gap-1 text-slate-400 hover:text-slate-200">
            <X size={13} /> Clear
          </button>
        )}

        <button
          onClick={() => qc.invalidateQueries({ queryKey: ['employees'] })}
          className="ml-auto p-1.5 text-slate-400 hover:text-slate-200 border border-slate-800 rounded bg-[#0B0F19] hover:bg-slate-800"
        >
          <RefreshCw size={14} />
        </button>

        <span className="text-slate-400">{totalCount} employee{totalCount !== 1 ? 's' : ''}</span>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <Card className="p-3.5 flex items-center gap-4 font-mono text-xs">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Status</label>
            <select
              value={filters.status || ''}
              onChange={e => setFilter('status', e.target.value)}
              className="px-3 py-1.5 bg-[#0B0F19] border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PROBATION">Probation</option>
              <option value="INACTIVE">Inactive</option>
              <option value="RESIGNED">Resigned</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Employment Type</label>
            <select
              value={filters.employment_type || ''}
              onChange={e => setFilter('employment_type', e.target.value)}
              className="px-3 py-1.5 bg-[#0B0F19] border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="PERMANENT">Permanent</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERN">Intern</option>
              <option value="CONSULTANT">Consultant</option>
            </select>
          </div>
        </Card>
      )}

      {/* Bulk action toolbar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded font-mono text-xs">
          <span className="font-bold text-blue-400">{selected.size} selected</span>
          <div className="flex items-center gap-2 ml-2">
            <button className="px-2.5 py-1 bg-slate-900 border border-slate-700 text-slate-200 rounded hover:bg-slate-800">
              Export Selected
            </button>
            <button className="px-2.5 py-1 bg-slate-900 border border-slate-700 text-slate-200 rounded hover:bg-slate-800">
              Bulk Update Status
            </button>
          </div>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-slate-400 hover:text-slate-200">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 font-mono text-xs text-slate-400 uppercase">
                <th className="py-2.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === employees.length && employees.length > 0}
                    onChange={toggleAll}
                    className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 accent-blue-600"
                  />
                </th>
                <th className="py-2.5 px-4">Employee</th>
                <th className="py-2.5 px-4">Dept / Designation</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Joining Date</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="py-3 px-4">
                        <div className="h-4 bg-slate-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400 text-xs font-semibold">No employees found</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {hasActiveFilters ? 'Try adjusting your search or filters' : 'Add your first employee to get started'}
                    </p>
                  </td>
                </tr>
              ) : (
                employees.map(emp => (
                  <tr
                    key={emp.id}
                    className={`hover:bg-slate-800/40 transition-colors ${selected.has(emp.id) ? 'bg-blue-500/10' : ''}`}
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selected.has(emp.id)}
                        onChange={() => toggleSelect(emp.id)}
                        className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 accent-blue-600"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(emp.full_name)}`}>
                          {initials(emp)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200 text-xs font-sans">{emp.full_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{emp.employee_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs text-slate-300 font-semibold">{emp.department_name ?? '—'}</div>
                      <div className="text-[11px] text-slate-400">{emp.designation_name ?? '—'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${TYPE_STYLES[emp.employment_type] ?? 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                        {emp.employment_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${STATUS_STYLES[emp.status] ?? 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">
                      {emp.joining_date ? new Date(emp.joining_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to="/employees/$employeeId"
                        params={{ employeeId: emp.id }}
                        className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                      >
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationBar
          meta={pagination}
          page={page}
          limit={limit}
          total={totalCount}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </Card>

      {/* Add Employee Modal */}
      {showAdd && (
        <AddEmployeeModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false)
            qc.invalidateQueries({ queryKey: ['employees'] })
            qc.invalidateQueries({ queryKey: ['employee-stats'] })
          }}
        />
      )}
    </div>
  )
}
