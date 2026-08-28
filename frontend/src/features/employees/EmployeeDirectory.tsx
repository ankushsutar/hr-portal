import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  Search, Plus, Download, RefreshCw, Users,
  Building2, Filter, X
} from 'lucide-react'
import { useState } from 'react'
import { AddEmployeeModal } from './AddEmployeeModal'
import { useAuth } from '../../contexts/AuthContext'

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
  ACTIVE:     'bg-green-50 text-green-700 border border-green-200',
  PROBATION:  'bg-amber-50 text-amber-700 border border-amber-200',
  INACTIVE:   'bg-gray-100 text-gray-500 border border-gray-200',
  TERMINATED: 'bg-red-50 text-red-700 border border-red-200',
  RESIGNED:   'bg-orange-50 text-orange-700 border border-orange-200',
}

const TYPE_STYLES: Record<string, string> = {
  PERMANENT:  'bg-blue-50 text-blue-700',
  CONTRACT:   'bg-purple-50 text-purple-700',
  INTERN:     'bg-cyan-50 text-cyan-700',
  CONSULTANT: 'bg-indigo-50 text-indigo-700',
}

function initials(emp: Employee) {
  return `${emp.first_name[0] ?? ''}${emp.last_name[0] ?? ''}`.toUpperCase()
}

function avatarColor(name: string) {
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-indigo-100 text-indigo-700',
    'bg-violet-100 text-violet-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-cyan-100 text-cyan-700',
  ]
  return colors[name.charCodeAt(0) % colors.length]
}

export const EmployeeDirectory = () => {
  const { hasRole } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [empType, setEmpType] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showAdd, setShowAdd] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (status) params.set('status', status)
  if (empType) params.set('employment_type', empType)

  const { data, isLoading } = useQuery({
    queryKey: ['employees', search, status, empType],
    queryFn: async () => {
      const res = await fetch(`/api/v1/employees?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  const { data: statsData } = useQuery({
    queryKey: ['employee-stats'],
    queryFn: async () => {
      const res = await fetch('/api/v1/employees/stats')
      if (!res.ok) return null
      return res.json()
    },
  })

  const employees: Employee[] = data?.data ?? []
  const stats = statsData?.data

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === employees.length) setSelected(new Set())
    else setSelected(new Set(employees.map(e => e.id)))
  }

  const clearFilters = () => { setStatus(''); setEmpType(''); setSearch('') }
  const hasFilters = status || empType || search

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {stats ? `${stats.total_active} active · ${stats.new_this_month} joined this month · ${stats.on_probation} on probation` : 'Loading stats...'}
          </p>
        </div>
        {hasRole(['HR_ADMIN', 'SUPER_ADMIN', 'HR_MANAGER']) && (
          <div className="flex items-center gap-2">
            <a
              href="/api/v1/employees/export"
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Download size={14} /> Export CSV
            </a>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus size={15} /> Add Employee
            </button>
          </div>
        )}
      </div>

      {/* Stats strip */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Active', value: stats.total_active, icon: Users, color: 'text-blue-600 bg-blue-50' },
            { label: 'New This Month', value: stats.new_this_month, icon: Plus, color: 'text-green-600 bg-green-50' },
            { label: 'On Probation', value: stats.on_probation, icon: Filter, color: 'text-amber-600 bg-amber-50' },
            { label: 'Probation Due Soon', value: stats.probation_due_soon, icon: Building2, color: 'text-red-600 bg-red-50' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
              <div className={`p-2 rounded-md ${s.color}`}>
                <s.icon size={16} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 font-mono">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, ID..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-md transition-colors ${showFilters || hasFilters ? 'border-blue-300 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          <Filter size={13} /> Filters
          {hasFilters && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
        </button>

        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600">
            <X size={13} /> Clear
          </button>
        )}

        <button
          onClick={() => qc.invalidateQueries({ queryKey: ['employees'] })}
          className="ml-auto p-2 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50"
        >
          <RefreshCw size={14} />
        </button>

        <span className="text-sm text-gray-400">{employees.length} employee{employees.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
            <label className="block text-xs font-medium text-gray-600 mb-1">Employment Type</label>
            <select
              value={empType}
              onChange={e => setEmpType(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Types</option>
              <option value="PERMANENT">Permanent</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERN">Intern</option>
              <option value="CONSULTANT">Consultant</option>
            </select>
          </div>
        </div>
      )}

      {/* Bulk action toolbar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <span className="font-medium text-blue-700">{selected.size} selected</span>
          <div className="flex items-center gap-2 ml-2">
            <button className="px-3 py-1 text-xs border border-blue-300 text-blue-700 rounded-md hover:bg-blue-100">
              Export Selected
            </button>
            <button className="px-3 py-1 text-xs border border-blue-300 text-blue-700 rounded-md hover:bg-blue-100">
              Bulk Update Status
            </button>
          </div>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-blue-400 hover:text-blue-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === employees.length && employees.length > 0}
                    onChange={toggleAll}
                    className="w-3.5 h-3.5 rounded border-gray-300 accent-blue-600"
                  />
                </th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Dept / Designation</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joining Date</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="py-3 px-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm font-medium">No employees found</p>
                    <p className="text-gray-300 text-xs mt-1">
                      {hasFilters ? 'Try adjusting your filters' : 'Add your first employee to get started'}
                    </p>
                  </td>
                </tr>
              ) : (
                employees.map(emp => (
                  <tr
                    key={emp.id}
                    className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${selected.has(emp.id) ? 'bg-blue-50/30' : ''}`}
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selected.has(emp.id)}
                        onChange={() => toggleSelect(emp.id)}
                        className="w-3.5 h-3.5 rounded border-gray-300 accent-blue-600"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(emp.full_name)}`}>
                          {initials(emp)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{emp.full_name}</div>
                          <div className="text-xs text-gray-400 font-mono">{emp.employee_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-700">{emp.department_name ?? '—'}</div>
                      <div className="text-xs text-gray-400">{emp.designation_name ?? '—'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${TYPE_STYLES[emp.employment_type] ?? 'bg-gray-100 text-gray-600'}`}>
                        {emp.employment_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[emp.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {emp.joining_date ? new Date(emp.joining_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to="/employees/$employeeId"
                        params={{ employeeId: emp.id }}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View <span className="hidden sm:inline">Profile</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
