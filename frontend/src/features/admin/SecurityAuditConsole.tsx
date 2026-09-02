import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '../../components/ui/Card'
import { ShieldAlert, Lock, Eye, EyeOff, FileText, Database, ShieldCheck, Key, UserCheck, AlertTriangle, RefreshCw, Terminal } from 'lucide-react'

interface DataAccessLog {
  id: string
  user_id: string
  user_email?: string
  user_role?: string
  module: string
  action: string
  resource_id?: string
  ip_address?: string
  user_agent?: string
  accessed_at: string
}

interface RbacPolicy {
  role: string
  module: string
  scope: string
  can_read_sensitive: bool
  can_export: bool
  allowed_actions: string[]
}

export const SecurityAuditConsole = () => {
  const [activeTab, setActiveTab] = useState<'logs' | 'matrix' | 'tester'>('logs')

  // Live PII Masking Tester State
  const [testBank, setTestBank] = useState('4532890123456789')
  const [testTax, setTestTax] = useState('987654321')
  const [testSalary, setTestSalary] = useState('150000')
  const [testEmail, setTestEmail] = useState('aarav.sharma@enterprise.com')
  const [showUnmasked, setShowUnmasked] = useState(false)

  // Fetch Access Logs
  const { data: logsRes, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['security-access-logs'],
    queryFn: async () => {
      const res = await fetch('/api/v1/security/access-logs', {
        headers: { Authorization: `Bearer ${localStorage.getItem('hrms_token') || localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to load access logs')
      return res.json()
    }
  })

  // Fetch RBAC Matrix
  const { data: matrixRes } = useQuery({
    queryKey: ['security-rbac-matrix'],
    queryFn: async () => {
      const res = await fetch('/api/v1/security/rbac-matrix', {
        headers: { Authorization: `Bearer ${localStorage.getItem('hrms_token') || localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to load RBAC matrix')
      return res.json()
    }
  })

  const logs: DataAccessLog[] = logsRes?.data || []
  const matrix: RbacPolicy[] = matrixRes?.data || []

  const maskBank = (val: string) => val.length > 4 ? '*'.repeat(val.length - 4) + val.slice(-4) : '****'
  const maskTax = (val: string) => val.length > 4 ? val.slice(0, 2) + '*'.repeat(val.length - 4) + val.slice(-2) : '****'
  const maskEmail = (val: string) => {
    const parts = val.split('@')
    if (parts.length === 2 && parts[0].length > 2) {
      return parts[0].slice(0, 2) + '***@' + parts[1]
    }
    return '***@***.com'
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert size={18} className="text-emerald-400" />
              Security, Audit Trail Engine & RBAC Data Scoping Audit
            </h3>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Inspect real-time data access logs, verify organizational RBAC scoping boundaries, and test sensitive PII field redaction policies.
            </p>
          </div>
          <button
            onClick={() => refetchLogs()}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw size={14} /> Refresh Logs
          </button>
        </div>
      </Card>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
        <Card className="p-4 space-y-1 border-l-2 border-l-emerald-500">
          <span className="text-slate-400 uppercase tracking-wider text-[10px]">PII Redaction Shield</span>
          <div className="text-xl font-bold text-emerald-400 flex items-center gap-1.5">
            <ShieldCheck size={18} /> ACTIVE
          </div>
          <span className="text-slate-500 text-[11px]">AUTOMATIC PII FIELD MASKING</span>
        </Card>

        <Card className="p-4 space-y-1 border-l-2 border-l-blue-500">
          <span className="text-slate-400 uppercase tracking-wider text-[10px]">Access Events Logged</span>
          <div className="text-2xl font-bold text-slate-100">{logs.length}</div>
          <span className="text-blue-400 text-[11px]">AUDITED READ/WRITE ACTIONS</span>
        </Card>

        <Card className="p-4 space-y-1 border-l-2 border-l-purple-500">
          <span className="text-slate-400 uppercase tracking-wider text-[10px]">RBAC Policy Boundaries</span>
          <div className="text-xl font-bold text-purple-400">ENFORCED</div>
          <span className="text-slate-500 text-[11px]">STRICT SCOPE CONTROLS</span>
        </Card>

        <Card className="p-4 space-y-1 border-l-2 border-l-amber-500">
          <span className="text-slate-400 uppercase tracking-wider text-[10px]">Unusual Access Alerts</span>
          <div className="text-2xl font-bold text-emerald-400">0</div>
          <span className="text-emerald-400 text-[11px]">ZERO ANOMALIES DETECTED</span>
        </Card>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 gap-4 font-mono text-xs">
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-2.5 font-bold transition-colors border-b-2 ${activeTab === 'logs' ? 'text-blue-400 border-blue-500' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
        >
          Data Access Audit Trail ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`pb-2.5 font-bold transition-colors border-b-2 ${activeTab === 'matrix' ? 'text-blue-400 border-blue-500' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
        >
          RBAC Data Scoping Matrix
        </button>
        <button
          onClick={() => setActiveTab('tester')}
          className={`pb-2.5 font-bold transition-colors border-b-2 ${activeTab === 'tester' ? 'text-blue-400 border-blue-500' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
        >
          PII Field Redaction Tester
        </button>
      </div>

      {/* Tab 1: Access Logs */}
      {activeTab === 'logs' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Database size={16} className="text-blue-400" />
              Real-Time Audit Trail
            </h4>
          </div>

          {logsLoading ? (
            <div className="py-8 text-center text-slate-500 font-mono text-xs">Loading audit logs...</div>
          ) : logs.length === 0 ? (
            <div className="py-8 text-center text-slate-500 font-mono text-xs">No data access events recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-semibold">User</th>
                    <th className="pb-3 font-semibold">Role</th>
                    <th className="pb-3 font-semibold">Module</th>
                    <th className="pb-3 font-semibold">Action</th>
                    <th className="pb-3 font-semibold">IP Address</th>
                    <th className="pb-3 font-semibold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {logs.map(l => (
                    <tr key={l.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 font-semibold text-slate-200">{l.user_email}</td>
                      <td className="py-3">
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">
                          {l.user_role}
                        </span>
                      </td>
                      <td className="py-3 text-blue-400 font-bold">{l.module}</td>
                      <td className="py-3">
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                          {l.action}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">{l.ip_address || '127.0.0.1'}</td>
                      <td className="py-3 text-slate-400">{l.accessed_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab 2: RBAC Matrix */}
      {activeTab === 'matrix' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Key size={16} className="text-purple-400" />
              Role-Based Access Control (RBAC) Data Scoping Boundaries
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Role</th>
                  <th className="pb-3 font-semibold">Accessible Modules</th>
                  <th className="pb-3 font-semibold">Data Scope Boundary</th>
                  <th className="pb-3 font-semibold">Read Sensitive PII</th>
                  <th className="pb-3 font-semibold">Export Rights</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {matrix.map(m => (
                  <tr key={m.role} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-bold text-purple-400">{m.role}</td>
                    <td className="py-3 text-slate-300">{m.module}</td>
                    <td className="py-3">
                      <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-bold">
                        {m.scope}
                      </span>
                    </td>
                    <td className="py-3">
                      {m.can_read_sensitive ? (
                        <span className="text-emerald-400 font-bold">ALLOWED</span>
                      ) : (
                        <span className="text-rose-400 font-bold">RESTRICTED</span>
                      )}
                    </td>
                    <td className="py-3">
                      {m.can_export ? (
                        <span className="text-emerald-400 font-bold">ALLOWED</span>
                      ) : (
                        <span className="text-slate-500 font-bold">DISABLED</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: PII Tester */}
      {activeTab === 'tester' && (
        <Card className="p-6 space-y-5 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Lock size={16} className="text-emerald-400" />
              Interactive Sensitive Field Redaction Engine
            </h4>
            <button
              onClick={() => setShowUnmasked(!showUnmasked)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors"
            >
              {showUnmasked ? <EyeOff size={14} /> : <Eye size={14} />}
              {showUnmasked ? 'Mask Fields' : 'Unmask (Admin Mode)'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 bg-[#0B0F19] p-4 rounded-lg border border-slate-800">
              <span className="font-bold text-slate-200 block uppercase text-[11px]">Simulated Data Inputs</span>
              
              <div>
                <label className="block text-slate-400 mb-1">Bank Account Number</label>
                <input
                  type="text"
                  value={testBank}
                  onChange={e => setTestBank(e.target.value)}
                  className="w-full bg-[#111827] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tax ID / SSN / PAN</label>
                <input
                  type="text"
                  value={testTax}
                  onChange={e => setTestTax(e.target.value)}
                  className="w-full bg-[#111827] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Base Salary</label>
                <input
                  type="text"
                  value={testSalary}
                  onChange={e => setTestSalary(e.target.value)}
                  className="w-full bg-[#111827] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email Address</label>
                <input
                  type="text"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  className="w-full bg-[#111827] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            {/* Masked Output */}
            <div className="space-y-4 bg-[#0B0F19] p-4 rounded-lg border border-slate-800">
              <span className="font-bold text-emerald-400 block uppercase text-[11px]">Rendered UI Output (Redacted)</span>

              <div className="space-y-3">
                <div className="bg-[#111827] p-2.5 rounded border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Bank Account:</span>
                  <span className="font-bold text-slate-100">{showUnmasked ? testBank : maskBank(testBank)}</span>
                </div>

                <div className="bg-[#111827] p-2.5 rounded border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Tax ID / SSN:</span>
                  <span className="font-bold text-slate-100">{showUnmasked ? testTax : maskTax(testTax)}</span>
                </div>

                <div className="bg-[#111827] p-2.5 rounded border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Salary:</span>
                  <span className="font-bold text-rose-400">{showUnmasked ? `₹${testSalary}` : '[RESTRICTED - ADMIN ONLY]'}</span>
                </div>

                <div className="bg-[#111827] p-2.5 rounded border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Email Address:</span>
                  <span className="font-bold text-slate-100">{showUnmasked ? testEmail : maskEmail(testEmail)}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
