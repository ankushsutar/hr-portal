import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Lock, Mail, Building, ArrowRight } from 'lucide-react'

export const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('http://localhost:8080/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Invalid credentials')
      }

      login(data.token, data.user)
    } catch (err: any) {
      setError(err.message || 'Failed to connect to server')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex w-full font-sans bg-gray-50">
      {/* Left Pane - Abstract Gradient */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-900 via-purple-900 to-black relative overflow-hidden items-center justify-center">
        {/* Decorative elements */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        <div className="relative z-10 text-center px-12 text-white animate-fade-in">
          <div className="inline-flex items-center justify-center p-4 bg-white/10 rounded-2xl backdrop-blur-md mb-8 ring-1 ring-white/20">
            <Building className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-heading font-bold tracking-tight mb-6">
            Enterprise <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">HRMS</span>
          </h1>
          <p className="text-lg text-indigo-100 max-w-md mx-auto leading-relaxed font-light">
            Streamline your workforce, automate workflows, and drive organizational success with our next-generation platform.
          </p>
        </div>
      </div>

      {/* Right Pane - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        {/* Mobile background */}
        <div className="absolute inset-0 lg:hidden bg-gradient-to-br from-indigo-900 to-black opacity-10"></div>
        
        <div className="w-full max-w-md space-y-8 relative z-10 animate-slide-in-right">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-heading font-bold text-gray-900 tracking-tight">
              Welcome back
            </h2>
            <p className="mt-3 text-sm text-gray-500">
              Please enter your credentials to access your account.
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-xl p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center animate-fade-in">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></div>
                  {error}
                </div>
              )}
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 ml-1">Email address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-600">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all duration-200"
                    placeholder="admin@company.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all duration-200"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-sm">
                  <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                    Forgot your password?
                  </a>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Authenticating...
                  </span>
                ) : (
                  <>
                    Sign in to portal
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
            
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="bg-indigo-50/50 rounded-lg p-4 border border-indigo-100">
                <p className="text-xs text-indigo-800 leading-relaxed font-medium">
                  <span className="block mb-1 text-indigo-900 font-semibold">Demo Credentials:</span>
                  admin@company.com <span className="text-indigo-400">|</span> admin123<br />
                  hr@company.com <span className="text-indigo-400">|</span> hr123<br />
                  employee@company.com <span className="text-indigo-400">|</span> emp123
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
