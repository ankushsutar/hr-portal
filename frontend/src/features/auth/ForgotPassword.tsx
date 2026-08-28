import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Card } from '../../components/ui/Card'

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
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex items-center justify-center p-6 font-sans">
      <Card className="w-full max-w-[420px] p-6 border-slate-800 bg-[#111827] shadow-2xl">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to sign in
        </Link>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-100">Reset password</h2>
          <p className="text-xs font-mono text-slate-400 mt-1">
            ENTER REGISTERED CORPORATE EMAIL TO RECEIVE PASSWORD RECOVERY TOKEN
          </p>
        </div>

        {mutation.isSuccess ? (
          <div className="space-y-4 font-mono text-xs">
            <div className="flex items-start gap-3 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
              <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-emerald-400">Reset Token Issued</p>
                <p className="text-slate-300 text-[11px] mt-0.5">
                  If that email is registered in our directory, a recovery token has been emitted.
                </p>
              </div>
            </div>

            {debugToken && (
              <div className="p-3.5 bg-[#0B0F19] border border-slate-800 rounded">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">DEMO ENVIRONMENT TOKEN</p>
                <code className="block text-[11px] text-blue-400 p-2 bg-slate-900 border border-slate-800 rounded break-all">{debugToken}</code>
                <Link
                  to="/reset-password"
                  search={{ token: debugToken }}
                  className="block mt-2.5 text-center text-xs text-blue-400 hover:text-blue-300 font-semibold"
                >
                  &rarr; Proceed to Reset Password Form
                </Link>
              </div>
            )}
          </div>
        ) : (
          <form
            onSubmit={e => { e.preventDefault(); mutation.mutate(email) }}
            className="space-y-4 font-mono text-xs"
          >
            <div>
              <label className="block text-slate-400 mb-1">Corporate Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F19] border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
                placeholder="employee@company.com"
                required
              />
            </div>

            {mutation.isError && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded text-rose-400 text-xs">
                <AlertCircle size={14} />
                {mutation.error instanceof Error ? mutation.error.message : 'Request failed'}
              </div>
            )}

            <button
              type="submit"
              disabled={mutation.isPending || !email}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors text-xs"
            >
              {mutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Emitting token...</> : 'Send recovery token'}
            </button>
          </form>
        )}
      </Card>
    </div>
  )
}
