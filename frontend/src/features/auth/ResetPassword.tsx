import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'

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
      setTimeout(() => navigate({ to: '/login' }), 2500)
    },
  })

  const mismatch = confirm.length > 0 && password !== confirm

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-8">
      <div className="w-full max-w-[400px]">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-8">
          <ArrowLeft size={14} /> Back to sign in
        </Link>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Set new password</h2>
          <p className="text-gray-500 text-sm mt-1">
            Choose a strong password for your account.
          </p>
        </div>

        {mutation.isSuccess ? (
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 size={18} className="text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">Password updated!</p>
              <p className="text-xs text-green-700 mt-0.5">Redirecting you to sign in…</p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={e => { e.preventDefault(); if (!mismatch) mutation.mutate({ token, password }) }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  minLength={8}
                  className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                  placeholder="At least 8 characters"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className={`w-full px-3 py-2.5 text-sm border rounded-md focus:outline-none focus:ring-2 bg-white transition-colors ${mismatch ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400' : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-400'}`}
                placeholder="Repeat password"
                required
              />
              {mismatch && <p className="text-xs text-red-600 mt-1">Passwords do not match</p>}
            </div>

            {mutation.isError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                <AlertCircle size={14} />
                {mutation.error instanceof Error ? mutation.error.message : 'Reset failed'}
              </div>
            )}

            <button
              type="submit"
              disabled={mutation.isPending || !password || !confirm || mismatch}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {mutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Updating...</> : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
