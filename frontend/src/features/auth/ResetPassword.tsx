import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { Card } from '../../components/ui/Card'

export const ResetPassword = () => {
  const search = useSearch({ from: '/reset-password' })
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (search as any)?.token ?? ''

  const mutation = useMutation({
    mutationFn: async ({ token, password }: { token: string; password: string }) => {
      const res = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Reset failed')
      return data
    },
    onSuccess: () => {
      setTimeout(() => navigate({ to: '/login' }), 2000)
    },
  })

  const mismatch = confirm.length > 0 && password !== confirm

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex items-center justify-center p-6 font-sans">
      <Card className="w-full max-w-[420px] p-6 border-slate-800 bg-[#111827] shadow-2xl">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to sign in
        </Link>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-100">Set new password</h2>
          <p className="text-xs font-mono text-slate-400 mt-1">
            PROVIDE STRONG CREDENTIAL SECRETS (MINIMUM 8 CHARACTERS)
          </p>
        </div>

        {mutation.isSuccess ? (
          <div className="flex items-start gap-3 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded font-mono text-xs">
            <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-emerald-400">Password Updated!</p>
              <p className="text-slate-300 text-[11px] mt-0.5">Redirecting to login portal...</p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={e => { e.preventDefault(); if (!mismatch) mutation.mutate({ token, password }) }}
            className="space-y-4 font-mono text-xs"
          >
            <div>
              <label className="block text-slate-400 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  minLength={8}
                  className="w-full px-3 py-2 pr-10 bg-[#0B0F19] border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
                  placeholder="At least 8 characters"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className={`w-full px-3 py-2 bg-[#0B0F19] border rounded text-slate-200 focus:outline-none text-xs transition-colors ${mismatch ? 'border-rose-500' : 'border-slate-800 focus:border-blue-500'}`}
                placeholder="Repeat new password"
                required
              />
              {mismatch && <p className="text-[11px] text-rose-400 mt-1">Passwords do not match</p>}
            </div>

            {mutation.isError && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded text-rose-400 text-xs">
                <AlertCircle size={14} />
                {mutation.error instanceof Error ? mutation.error.message : 'Reset failed'}
              </div>
            )}

            <button
              type="submit"
              disabled={mutation.isPending || !password || !confirm || mismatch}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors text-xs"
            >
              {mutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Updating...</> : 'Update password'}
            </button>
          </form>
        )}
      </Card>
    </div>
  )
}
