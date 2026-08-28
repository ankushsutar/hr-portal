import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { Loader2, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react'

export const Login = () => {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const loginMutation = useMutation({
    mutationFn: async (creds: { email: string; password: string }) => {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error ?? 'Invalid credentials')
      return data
    },
    onSuccess: (data) => {
      login(data.token, data.user)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email && password) loginMutation.mutate({ email, password })
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex">
      {/* Left panel — developer branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#0F1523] flex-col justify-between p-12 border-r border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5 mb-16">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-mono font-bold text-white text-xs">
              H
            </div>
            <span className="text-slate-100 font-bold text-base tracking-tight font-mono">HRMS CORE</span>
          </div>

          <div className="space-y-4">
            <span className="text-xs font-mono uppercase text-blue-400 font-semibold px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
              Enterprise Console v2.0
            </span>
            <h1 className="text-3xl font-bold text-slate-100 leading-tight">
              Enterprise HR Operations,<br />
              <span className="text-blue-400 font-mono">streamlined & automated.</span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              High-density HR workspace engineered for Indian compliance, biometric attendance engines, multi-tier workflows, and automated payroll processing.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Employee Directory', desc: 'Lifecycle & Profiles' },
            { label: 'Indian Statutory Payroll', desc: 'TDS, PF, ESIC Ready' },
            { label: 'Biometric Integration', desc: 'eSSL Attendance Logs' },
            { label: 'Leave Engine', desc: 'OD, WFH & Sandwich Rules' },
          ].map(item => (
            <div key={item.label} className="bg-[#111827] border border-slate-800/80 rounded p-3">
              <p className="text-slate-200 text-xs font-semibold">{item.label}</p>
              <p className="text-slate-500 text-[11px] font-mono mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — console login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#0B0F19]">
        <div className="w-full max-w-[380px]">
          {/* Mobile branding */}
          <div className="flex items-center gap-2.5 mb-6 lg:hidden">
            <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center font-mono font-bold text-white text-xs">
              H
            </div>
            <span className="text-slate-100 font-mono font-bold text-sm">HRMS CORE</span>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-100">Sign In to Console</h2>
            <p className="text-slate-400 text-xs font-mono mt-1">Authenticate your enterprise credentials.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Corporate Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#111827] border border-slate-800 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-mono text-slate-400">Password</label>
                <a
                  href="/forgot-password"
                  className="text-xs font-mono text-blue-400 hover:text-blue-300"
                >
                  Reset?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#111827] border border-slate-800 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono pr-9"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {loginMutation.isError && (
              <div className="flex items-center gap-2 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded text-rose-400 text-xs font-mono">
                <AlertCircle size={14} className="shrink-0" />
                {loginMutation.error instanceof Error ? loginMutation.error.message : 'Invalid credentials'}
              </div>
            )}

            <button
              type="submit"
              disabled={loginMutation.isPending || !email || !password}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-semibold rounded disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {loginMutation.isPending ? (
                <><Loader2 size={14} className="animate-spin" /> Authenticating...</>
              ) : (
                'Sign In to Workspace'
              )}
            </button>
          </form>

          {/* Quick Preset Accounts */}
          <div className="mt-6 p-4 bg-[#111827] border border-slate-800/80 rounded">
            <div className="flex items-center gap-1.5 text-slate-400 mb-2">
              <ShieldCheck size={13} className="text-blue-400" />
              <p className="text-[10px] font-mono uppercase tracking-wider font-semibold">Demo Role Presets</p>
            </div>
            <div className="space-y-1 text-xs font-mono">
              {[
                { role: 'Super Admin', email: 'admin@company.com', pass: 'admin123' },
                { role: 'HR Admin', email: 'hr@company.com', pass: 'hr123' },
                { role: 'Manager', email: 'manager@company.com', pass: 'mgr123' },
                { role: 'Employee', email: 'employee@company.com', pass: 'emp123' },
              ].map(d => (
                <button
                  key={d.role}
                  type="button"
                  onClick={() => { setEmail(d.email); setPassword(d.pass) }}
                  className="w-full flex items-center justify-between px-2 py-1 hover:bg-slate-800/60 rounded text-slate-300 transition-colors"
                >
                  <span>{d.role}</span>
                  <span className="text-blue-400 text-[11px]">{d.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
