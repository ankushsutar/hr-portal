import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '../../components/ui/Card'
import { useState } from 'react'
import {
  Loader2, UserPlus, Check, X, Mail, Shield, MoreHorizontal,
  ChevronDown, Search, RefreshCw, Trash2
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface User {
  id: string
  email: string
  is_active: boolean
  last_login: string | null
  invited_at: string | null
  roles: string[]
  employee_id: string | null
}

interface Role {
  id: string
  name: string
  description: string | null
}

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN:   'bg-purple-50 text-purple-700 border border-purple-200',
  HR_ADMIN:      'bg-blue-50 text-blue-700 border border-blue-200',
  HR_MANAGER:    'bg-indigo-50 text-indigo-700 border border-indigo-200',
  MANAGER:       'bg-cyan-50 text-cyan-700 border border-cyan-200',
  PAYROLL_ADMIN: 'bg-amber-50 text-amber-700 border border-amber-200',
  EMPLOYEE:      'bg-gray-100 text-gray-600 border border-gray-200',
}

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem('hrms_token')}` }
}

export const Users = () => {
  const { hasRole } = useAuth()
  const queryClient = useQueryClient()
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('EMPLOYEE')
  const [search, setSearch] = useState('')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [inviteResult, setInviteResult] = useState<string | null>(null)

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/v1/users', { headers: authHeader() })
      if (!res.ok) throw new Error('Failed to fetch users')
      return res.json()
    },
  })

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await fetch('/api/v1/users/roles', { headers: authHeader() })
      if (!res.ok) throw new Error('Failed to fetch roles')
      return res.json()
    },
  })

  const roles: Role[] = rolesData?.data ?? []
  const users: User[] = (usersData?.data ?? []).filter((u: User) =>
    !search || u.email.toLowerCase().includes(search.toLowerCase())
  )

  const inviteMutation = useMutation({
    mutationFn: async (payload: { email: string; role: string }) => {
      const res = await fetch('/api/v1/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setInviteResult(data.invitation_token ?? null)
      setEmail('')
    },
  })

  const toggleStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const endpoint = isActive ? `/api/v1/users/${id}/suspend` : `/api/v1/users/${id}/activate`
      const res = await fetch(endpoint, { method: 'POST', headers: authHeader() })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const changeRole = useMutation({
    mutationFn: async ({ id, newRole }: { id: string; newRole: string }) => {
      const res = await fetch(`/api/v1/users/${id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setOpenMenu(null)
    },
  })

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/users/${id}`, { method: 'DELETE', headers: authHeader() })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  if (!hasRole(['SUPER_ADMIN', 'HR_ADMIN'])) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Access Denied</p>
          <p className="text-sm text-gray-400">You don't have permission to view this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage system access, roles, and employee linking.</p>
        </div>
        <button
          onClick={() => { setIsInviteOpen(true); setInviteResult(null) }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm"
        >
          <UserPlus size={15} />
          Invite User
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by email..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
          className="p-2 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} />
        </button>
        <span className="ml-auto text-sm text-gray-400">
          {users.length} user{users.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Login</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="py-3 px-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Mail className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No users found</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900 text-sm">{u.email}</div>
                      {u.invited_at && !u.last_login && (
                        <div className="text-xs text-amber-600 mt-0.5">Invitation pending</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setOpenMenu(openMenu === u.id + '-role' ? null : u.id + '-role')}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${ROLE_COLORS[u.roles?.[0]] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {u.roles?.[0] ?? 'No Role'}
                          <ChevronDown size={10} />
                        </button>
                        {openMenu === u.id + '-role' && (
                          <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-md min-w-[160px] py-1">
                            {roles.map(r => (
                              <button
                                key={r.id}
                                onClick={() => changeRole.mutate({ id: u.id, newRole: r.name })}
                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 text-gray-700"
                              >
                                {r.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full border border-gray-200">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {u.last_login ? new Date(u.last_login).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500 font-mono">
                      {u.employee_id ? (
                        <span className="text-blue-600 text-xs">Linked</span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        >
                          <MoreHorizontal size={15} />
                        </button>
                        {openMenu === u.id && (
                          <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-md min-w-[160px] py-1">
                            <button
                              onClick={() => { toggleStatus.mutate({ id: u.id, isActive: u.is_active }); setOpenMenu(null) }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                            >
                              {u.is_active ? <><X size={13} className="text-red-500" /> Suspend</> : <><Check size={13} className="text-green-500" /> Activate</>}
                            </button>
                            <div className="border-t border-gray-100 my-1" />
                            <button
                              onClick={() => { if (confirm('Delete this user? This cannot be undone.')) deleteUser.mutate(u.id) }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <Card className="w-full max-w-md bg-white shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Invite New User</h3>
                  <p className="text-sm text-gray-500 mt-0.5">They'll receive an invitation to set their password.</p>
                </div>
                <button onClick={() => setIsInviteOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              {inviteResult ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800 mb-2">✓ Invitation created successfully</p>
                    <p className="text-xs text-green-700 mb-2">Share this token with the user to set their password:</p>
                    <code className="block text-xs bg-white border border-green-200 p-2 rounded font-mono break-all text-gray-700">{inviteResult}</code>
                    <p className="text-xs text-gray-500 mt-2">In production, this token is sent via email automatically.</p>
                  </div>
                  <button
                    onClick={() => { setIsInviteOpen(false); setInviteResult(null) }}
                    className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                      placeholder="name@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">System Role <span className="text-red-500">*</span></label>
                    <select
                      value={role}
                      onChange={e => setRole(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                    >
                      {roles.length > 0 ? roles.map(r => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      )) : (
                        <>
                          <option value="SUPER_ADMIN">Super Admin</option>
                          <option value="HR_ADMIN">HR Admin</option>
                          <option value="HR_MANAGER">HR Manager</option>
                          <option value="MANAGER">Manager</option>
                          <option value="PAYROLL_ADMIN">Payroll Admin</option>
                          <option value="EMPLOYEE">Employee</option>
                        </>
                      )}
                    </select>
                  </div>
                  {inviteMutation.isError && (
                    <p className="text-sm text-red-600">{String(inviteMutation.error)}</p>
                  )}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setIsInviteOpen(false)}
                      className="flex-1 px-4 py-2 text-sm border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => inviteMutation.mutate({ email, role })}
                      disabled={inviteMutation.isPending || !email}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {inviteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                      Send Invitation
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Close dropdowns on outside click */}
      {openMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
      )}
    </div>
  )
}
