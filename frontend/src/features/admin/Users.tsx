import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Loader2, UserPlus, Check, X, Mail } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Card } from '../../components/ui/Card'

export const Users = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('EMPLOYEE')

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/v1/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to fetch users')
      return res.json()
    }
  })

  const inviteUser = useMutation({
    mutationFn: async (payload: { email: string, role: string }) => {
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to invite user')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setIsInviteModalOpen(false)
      setEmail('')
    }
  })

  const toggleUserStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: string, isActive: boolean }) => {
      const endpoint = isActive ? `/api/v1/users/${id}/suspend` : `/api/v1/users/${id}/activate`
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to update status')
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  })

  if (user?.roles?.[0] !== 'SUPER_ADMIN') {
    return <div className="p-8 text-red-500">Access Denied</div>
  }

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">User Management</h1>
          <p className="text-gray-500 mt-1">Manage system access, roles, and employee linking.</p>
        </div>
        <button 
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
        >
          <UserPlus size={18} />
          Invite User
        </button>
      </div>

      <Card className="overflow-hidden border border-gray-100 shadow-sm backdrop-blur-xl bg-white/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="py-4 px-6 font-medium text-gray-500">Email</th>
                <th className="py-4 px-6 font-medium text-gray-500">Role</th>
                <th className="py-4 px-6 font-medium text-gray-500">Status</th>
                <th className="py-4 px-6 font-medium text-gray-500">Last Login</th>
                <th className="py-4 px-6 font-medium text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                  </td>
                </tr>
              ) : (
                users?.data?.map((u: any) => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-white/80 transition-colors">
                    <td className="py-4 px-6 font-medium">{u.email}</td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {u.roles?.[0] || 'NONE'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 text-green-600 font-medium text-sm">
                          <Check size={14} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 font-medium text-sm">
                          <X size={14} /> Suspended
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-gray-500 text-sm">
                      {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => toggleUserStatus.mutate({ id: u.id, isActive: u.is_active })}
                        className={`text-sm font-medium ${u.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
                      >
                        {u.is_active ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-md p-6 bg-white shadow-2xl animate-slide-up">
            <h3 className="text-xl font-bold mb-4">Invite New User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                  placeholder="name@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">System Role</label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                >
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="HR_ADMIN">HR Admin</option>
                  <option value="EMPLOYEE">Employee</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setIsInviteModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={() => inviteUser.mutate({ email, role })}
                disabled={inviteUser.isPending}
                className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center justify-center gap-2"
              >
                {inviteUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail size={16} />}
                Send Invite
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
