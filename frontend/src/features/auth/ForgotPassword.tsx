import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [debugToken, setDebugToken] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Request failed')
      return data
    },
    onSuccess: (data) => {
      setDebugToken(data.debug_token ?? null)
    },
  })

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-8">
      <div className="w-full max-w-[400px]">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-8">
          <ArrowLeft size={14} /> Back to sign in
        </Link>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Reset password</h2>
          <p className="text-gray-500 text-sm mt-1">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {mutation.isSuccess ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 size={18} className="text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">Reset link sent</p>
                <p className="text-xs text-green-700 mt-0.5">
                  If that email exists, you'll receive a reset link shortly.
                </p>
              </div>
            </div>

            {debugToken && (
              <div className="p-4 bg-white border border-gray-200 rounded-lg">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Demo — Reset Token</p>
                <p className="text-xs text-gray-500 mb-2">In production this is sent via email. Use this to test:</p>
                <code className="block text-xs bg-gray-50 border border-gray-200 p-2 rounded font-mono break-all">{debugToken}</code>
                <Link
                  to="/reset-password"
                  search={{ token: debugToken }}
                  className="block mt-3 text-center text-xs text-blue-600 hover:underline"
                >
                  → Go to Reset Password page
                </Link>
              </div>
            )}
          </div>
        ) : (
          <form
            onSubmit={e => { e.preventDefault(); mutation.mutate(email) }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                placeholder="you@company.com"
                required
              />
            </div>

            {mutation.isError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                <AlertCircle size={14} />
                {mutation.error instanceof Error ? mutation.error.message : 'Request failed'}
              </div>
            )}

            <button
              type="submit"
              disabled={mutation.isPending || !email}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {mutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Sending...</> : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
