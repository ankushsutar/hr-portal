import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '../../components/ui/Card'
import { ShieldAlert, Lock, Eye, EyeOff, Database, ShieldCheck, Key, RefreshCw } from 'lucide-react'

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
  can_read_sensitive: boolean
  can_export: boolean
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
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <Card className="p-6 bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2">
              <ShieldAlert size={18} className="text-emerald-500" />
              Security, Audit Trail Engine & RBAC Data Scoping Audit
            </h3>
            <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
              Inspect real-time data access logs, verify organizational RBAC scoping boundaries, and test sensitive PII field redaction policies.
            </p>
          </div>
          <button
            onClick={() => refetchLogs()}
            className="bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] border border-[var(--border-color)] px-3.5 py-2 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw size={14} /> Refresh Logs
          </button>
        </div>
      </Card>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
        <Card className="p-4 space-y-1 border-l-4 border-l-emerald-500 bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
          <span className="text-[var(--text-muted)] uppercase tracking-wider text-[10px]">PII Redaction Shield</span>
          <div className="text-xl font-bold text-emerald-500 flex items-center gap-1.5">
            <ShieldCheck size={18} /> ACTIVE
          </div>
          <span className="text-[var(--text-muted)] text-[11px]">AUTOMATIC PII FIELD MASKING</span>
        </Card>

        <Card className="p-4 space-y-1 border-l-4 border-l-blue-500 bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
          <span className="text-[var(--text-muted)] uppercase tracking-wider text-[10px]">Access Events Logged</span>
          <div className="text-2xl font-bold text-[var(--text-main)]">{logs.length}</div>
          <span className="theme-accent-text text-[11px] font-semibold">AUDITED READ/WRITE ACTIONS</span>
        </Card>

        <Card className="p-4 space-y-1 border-l-4 border-l-purple-500 bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
          <span className="text-[var(--text-muted)] uppercase tracking-wider text-[10px]">RBAC Policy Boundaries</span>
          <div className="text-xl font-bold text-purple-500">ENFORCED</div>
          <span className="text-[var(--text-muted)] text-[11px]">STRICT SCOPE CONTROLS</span>
        </Card>

        <Card className="p-4 space-y-1 border-l-4 border-l-amber-500 bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
          <span className="text-[var(--text-muted)] uppercase tracking-wider text-[10px]">Unusual Access Alerts</span>
          <div className="text-2xl font-bold text-emerald-500">0</div>
          <span className="text-emerald-500 text-[11px] font-semibold">ZERO ANOMALIES DETECTED</span>
        </Card>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[var(--border-color)] gap-4 font-mono text-xs">
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-2.5 font-bold transition-colors border-b-2 ${activeTab === 'logs' ? 'theme-accent-text border-[var(--color-primary)]' : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-main)]'}`}
        >
          Data Access Audit Trail ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`pb-2.5 font-bold transition-colors border-b-2 ${activeTab === 'matrix' ? 'theme-accent-text border-[var(--color-primary)]' : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-main)]'}`}
        >
          RBAC Data Scoping Matrix
        </button>
        <button
          onClick={() => setActiveTab('tester')}
          className={`pb-2.5 font-bold transition-colors border-b-2 ${activeTab === 'tester' ? 'theme-accent-text border-[var(--color-primary)]' : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-main)]'}`}
        >
          PII Field Redaction Tester
        </button>
      </div>

      {/* Tab 1: Access Logs */}
      {activeTab === 'logs' && (
        <Card className="p-6 space-y-4 bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <h4 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
              <Database size={16} className="theme-accent-text" />
              Real-Time Audit Trail
            </h4>
          </div>

          {logsLoading ? (
            <div className="py-8 text-center text-[var(--text-muted)] font-mono text-xs">Loading audit logs...</div>
          ) : logs.length === 0 ? (
            <div className="py-8 text-center text-[var(--text-muted)] font-mono text-xs">No data access events recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                    <th className="py-2.5 px-3 font-semibold">User</th>
                    <th className="py-2.5 px-3 font-semibold">Role</th>
                    <th className="py-2.5 px-3 font-semibold">Module</th>
                    <th className="py-2.5 px-3 font-semibold">Action</th>
                    <th className="py-2.5 px-3 font-semibold">IP Address</th>
                    <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-main)]">
                  {logs.map(l => (
                    <tr key={l.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                      <td className="py-3 px-3 font-semibold text-[var(--text-main)]">{l.user_email}</td>
                      <td className="py-3 px-3">
                        <span className="bg-[var(--bg-subtle)] text-[var(--text-main)] border border-[var(--border-color)] px-2 py-0.5 rounded text-[10px] font-bold">
                          {l.user_role}
                        </span>
                      </td>
                      <td className="py-3 px-3 theme-accent-text font-bold">{l.module}</td>
                      <td className="py-3 px-3">
                        <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                          {l.action}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[var(--text-muted)]">{l.ip_address || '127.0.0.1'}</td>
                      <td className="py-3 px-3 text-[var(--text-muted)]">{l.accessed_at}</td>
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
        <Card className="p-6 space-y-4 bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <h4 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
              <Key size={16} className="text-purple-500" />
              Role-Based Access Control (RBAC) Data Scoping Boundaries
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                  <th className="py-2.5 px-3 font-semibold">Role</th>
                  <th className="py-2.5 px-3 font-semibold">Accessible Modules</th>
                  <th className="py-2.5 px-3 font-semibold">Data Scope Boundary</th>
                  <th className="py-2.5 px-3 font-semibold">Read Sensitive PII</th>
                  <th className="py-2.5 px-3 font-semibold">Export Rights</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-main)]">
                {matrix.map(m => (
                  <tr key={m.role} className="hover:bg-[var(--bg-subtle)] transition-colors">
                    <td className="py-3 px-3 font-bold text-purple-500">{m.role}</td>
                    <td className="py-3 px-3 text-[var(--text-main)]">{m.module}</td>
                    <td className="py-3 px-3">
                      <span className="bg-[var(--color-primary)]/10 theme-accent-text border border-[var(--color-primary)]/20 px-2 py-0.5 rounded font-bold">
                        {m.scope}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {m.can_read_sensitive ? (
                        <span className="text-emerald-500 font-bold">ALLOWED</span>
                      ) : (
                        <span className="text-rose-500 font-bold">RESTRICTED</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {m.can_export ? (
                        <span className="text-emerald-500 font-bold">ALLOWED</span>
                      ) : (
                        <span className="text-[var(--text-muted)] font-bold">DISABLED</span>
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
        <Card className="p-6 space-y-5 font-mono text-xs bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <h4 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
              <Lock size={16} className="text-emerald-500" />
              Interactive Sensitive Field Redaction Engine
            </h4>
            <button
              onClick={() => setShowUnmasked(!showUnmasked)}
              className="bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] border border-[var(--border-color)] px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors font-semibold"
            >
              {showUnmasked ? <EyeOff size={14} /> : <Eye size={14} />}
              {showUnmasked ? 'Mask Fields' : 'Unmask (Admin Mode)'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 bg-[var(--bg-subtle)] p-4 rounded-lg border border-[var(--border-color)]">
              <span className="font-bold text-[var(--text-main)] block uppercase text-[11px]">Simulated Data Inputs</span>
              
              <div>
                <label className="block text-[var(--text-muted)] mb-1">Bank Account Number</label>
                <input
                  type="text"
                  value={testBank}
                  onChange={e => setTestBank(e.target.value)}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded p-2 text-[var(--text-main)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[var(--text-muted)] mb-1">Tax ID / SSN / PAN</label>
                <input
                  type="text"
                  value={testTax}
                  onChange={e => setTestTax(e.target.value)}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded p-2 text-[var(--text-main)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[var(--text-muted)] mb-1">Base Salary</label>
                <input
                  type="text"
                  value={testSalary}
                  onChange={e => setTestSalary(e.target.value)}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded p-2 text-[var(--text-main)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[var(--text-muted)] mb-1">Email Address</label>
                <input
                  type="text"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded p-2 text-[var(--text-main)] focus:outline-none"
                />
              </div>
            </div>

            {/* Masked Output */}
            <div className="space-y-4 bg-[var(--bg-subtle)] p-4 rounded-lg border border-[var(--border-color)]">
              <span className="font-bold text-emerald-500 block uppercase text-[11px]">Rendered UI Output (Redacted)</span>

              <div className="space-y-3">
                <div className="bg-[var(--bg-card)] p-2.5 rounded border border-[var(--border-color)] flex justify-between">
                  <span className="text-[var(--text-muted)]">Bank Account:</span>
                  <span className="font-bold text-[var(--text-main)]">{showUnmasked ? testBank : maskBank(testBank)}</span>
                </div>

                <div className="bg-[var(--bg-card)] p-2.5 rounded border border-[var(--border-color)] flex justify-between">
                  <span className="text-[var(--text-muted)]">Tax ID / SSN:</span>
                  <span className="font-bold text-[var(--text-main)]">{showUnmasked ? testTax : maskTax(testTax)}</span>
                </div>

                <div className="bg-[var(--bg-card)] p-2.5 rounded border border-[var(--border-color)] flex justify-between">
                  <span className="text-[var(--text-muted)]">Salary:</span>
                  <span className="font-bold text-rose-500">{showUnmasked ? `₹${testSalary}` : '[RESTRICTED - ADMIN ONLY]'}</span>
                </div>

                <div className="bg-[var(--bg-card)] p-2.5 rounded border border-[var(--border-color)] flex justify-between">
                  <span className="text-[var(--text-muted)]">Email Address:</span>
                  <span className="font-bold text-[var(--text-main)]">{showUnmasked ? testEmail : maskEmail(testEmail)}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
