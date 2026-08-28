import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react'

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
    <div className="min-h-screen bg-[#F5F5F7] flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-gray-900 flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-2.5 mb-16">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a5 5 0 110 10A5 5 0 018 3zm0 2a3 3 0 100 6 3 3 0 000-6z" />
              </svg>
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">HRMS</span>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Your HR operations,<br />
              <span className="text-blue-400">unified.</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Manage your entire employee lifecycle — from onboarding to payroll — in one platform built for Indian operations.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Employee Lifecycle', desc: 'Onboarding to exit' },
            { label: 'Indian Payroll', desc: 'TDS, PF, ESIC ready' },
            { label: 'ESSL Integration', desc: 'Biometric attendance' },
            { label: 'Leave & Attendance', desc: 'OD, WFH, Comp-off' },
          ].map(item => (
            <div key={item.label} className="bg-white/5 border border-white/10 rounded-lg p-4">
              <p className="text-white text-sm font-medium">{item.label}</p>
              <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a5 5 0 110 10A5 5 0 018 3zm0 2a3 3 0 100 6 3 3 0 000-6z" />
              </svg>
            </div>
            <span className="text-gray-900 font-semibold text-lg">HRMS</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Sign in</h2>
            <p className="text-gray-500 text-sm mt-1">Enter your credentials to access the dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white transition-shadow"
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <a
                  href="/forgot-password"
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white pr-10 transition-shadow"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {loginMutation.isError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                <AlertCircle size={15} className="shrink-0" />
                {loginMutation.error instanceof Error ? loginMutation.error.message : 'Invalid credentials'}
              </div>
            )}

            <button
              type="submit"
              disabled={loginMutation.isPending || !email || !password}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              {loginMutation.isPending ? (
                <><Loader2 size={15} className="animate-spin" /> Signing in...</>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 p-4 bg-white border border-gray-200 rounded-lg">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Demo Credentials</p>
            <div className="space-y-2">
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
                  className="w-full flex items-center justify-between text-left px-3 py-2 hover:bg-gray-50 rounded-md transition-colors group"
                >
                  <span className="text-xs font-medium text-gray-700">{d.role}</span>
                  <span className="text-xs text-gray-400 font-mono group-hover:text-blue-600 transition-colors">{d.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
