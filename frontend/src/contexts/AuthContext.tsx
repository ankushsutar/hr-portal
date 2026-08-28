import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useRouter } from '@tanstack/react-router'

export type DataScope = 'SELF' | 'DIRECT_REPORTS' | 'DEPARTMENT' | 'ORGANIZATION' | 'SALARY_ACCESS'

export interface User {
  id: string
  email: string
  roles: string[]
  scope?: DataScope
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
  hasRole: (roles: string[]) => boolean
  hasScope: (minScope: DataScope) => boolean
  isLoading: boolean
}

const scopePower: Record<DataScope, number> = {
  SELF: 1,
  DIRECT_REPORTS: 2,
  DEPARTMENT: 3,
  ORGANIZATION: 4,
  SALARY_ACCESS: 5,
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const storedToken = localStorage.getItem('hrms_token')
    const storedUser = localStorage.getItem('hrms_user')
    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('hrms_token')
        localStorage.removeItem('hrms_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = (newToken: string, newUser: User) => {
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('hrms_token', newToken)
    localStorage.setItem('hrms_user', JSON.stringify(newUser))
    router.navigate({ to: '/' })
  }

  const logout = async () => {
    // Notify backend
    if (token) {
      fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }
    setToken(null)
    setUser(null)
    localStorage.removeItem('hrms_token')
    localStorage.removeItem('hrms_user')
    router.navigate({ to: '/login' })
  }

  const hasRole = (allowedRoles: string[]) => {
    if (!user) return false
    if (user.roles.includes('SUPER_ADMIN')) return true
    return allowedRoles.some(role => user.roles.includes(role))
  }

  const hasScope = (minScope: DataScope) => {
    if (!user) return false
    const currentScope = user.scope ?? 'SELF'
    return scopePower[currentScope] >= scopePower[minScope]
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, hasRole, hasScope, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
