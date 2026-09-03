import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { LayoutDashboard, Users, Calendar, Clock, DollarSign, Target, Briefcase, Settings, HelpCircle, LogOut, Bell, Search, Shield, ChevronRight, Cpu, CheckSquare, X, Menu, Palette } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useThemeStore } from '../../stores/themeStore'
import { ThemeCustomizerModal } from '../theme/ThemeCustomizerModal'
import { QuickPunchWidget } from '../../features/attendance/QuickPunchWidget'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { name: 'Universal Inbox', href: '/inbox', icon: CheckSquare, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'] },
  { name: 'HR Task Center', href: '/hr-tasks', icon: Clock, roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
  { name: 'People', href: '/employees', icon: Users, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { name: 'Attendance', href: '/attendance', icon: Calendar, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { name: 'Leave', href: '/leave', icon: Calendar, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { name: 'Payroll', href: '/payroll', icon: DollarSign, roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
  { name: 'Performance', href: '/performance', icon: Target, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'] },
  { name: 'Recruitment', href: '/recruitment', icon: Briefcase, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'] },
  { name: 'Services', href: '/services', icon: HelpCircle, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { name: 'HR Helpdesk', href: '/helpdesk', icon: HelpCircle, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { name: 'Organization', href: '/organization', icon: Settings, roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
  { name: 'Data Quality', href: '/data-quality', icon: Shield, roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
  { name: 'Security & Audit', href: '/security-audit', icon: Shield, roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
  { name: 'Reports', href: '/reports', icon: Cpu, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'] },
  { name: 'Bulk Operations', href: '/import', icon: Cpu, roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
]

export const Layout = () => {
  const { user, logout, hasRole } = useAuth() as any
  const routerState = useRouterState()
  const setCustomizerOpen = useThemeStore(state => state.setCustomizerOpen)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const { data: notifsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/v1/workflow/notifications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('hrms_token') || localStorage.getItem('token')}` }
      })
      if (!res.ok) return { data: [] }
      return res.json()
    }
  })

  const notifications = notifsData?.data || []
  const unreadCount = notifications.filter((n: any) => !n.is_read).length
  
  const currentNav = navigation.find(n => n.href === routerState.location.pathname) || 
                     navigation.find(n => routerState.location.pathname.startsWith(n.href) && n.href !== '/')
  const pageTitle = currentNav ? currentNav.name : 'Console'

  return (
    <div className="flex h-screen bg-[var(--bg-page)] text-[var(--text-main)] font-sans overflow-hidden transition-colors">
      {/* Sidebar for Desktop & Mobile Overlay */}
      <aside className={`w-64 flex flex-col bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] z-30 transition-transform duration-200 fixed md:static inset-y-0 left-0 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* Console Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded theme-accent-bg flex items-center justify-center font-mono font-bold text-white text-xs shadow-sm">
              H
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-[var(--text-main)] tracking-tight text-sm">HRMS</span>
              <span className="text-[10px] font-mono theme-accent-text bg-[var(--color-primary)]/10 px-1.5 py-0.5 rounded border border-[var(--color-primary)]/20 uppercase tracking-widest font-semibold">CORE</span>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-[var(--text-muted)] hover:text-[var(--text-main)]"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 custom-scrollbar">
          <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider px-3 mb-2 font-semibold">
            WORKSPACE
          </div>
          {navigation.filter(item => hasRole(item.roles)).map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="group flex items-center px-3 py-2 text-xs font-medium rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-main)] transition-colors duration-150 focus-visible:outline-none [&.active]:bg-[var(--color-primary)]/10 [&.active]:text-[var(--color-primary)] [&.active]:font-semibold [&.active]:border-l-2 [&.active]:border-[var(--color-primary)]"
            >
              <item.icon className="mr-2.5 h-4 w-4 shrink-0 text-[var(--text-muted)] group-hover:text-[var(--text-main)] group-[.active]:text-[var(--color-primary)] transition-colors" />
              <span className="truncate">{item.name}</span>
            </Link>
          ))}
        </nav>
        
        {/* Bottom User Pill */}
        <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-subtle)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0 pr-2">
              <div className="h-7 w-7 rounded bg-[var(--bg-card)] border border-[var(--border-color)] theme-accent-text flex items-center justify-center font-mono text-xs font-bold shrink-0">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="ml-2.5 truncate">
                <p className="text-xs font-medium text-[var(--text-main)] truncate leading-none">{user?.email}</p>
                <p className="text-[10px] font-mono text-[var(--text-muted)] truncate mt-1">{user?.roles?.[0] || 'USER'}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="p-1.5 text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 z-20 md:hidden backdrop-blur-xs"
        />
      )}

      {/* Main Console Workspace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-[var(--bg-page)]">
        {/* Top Header / Breadcrumb Bar */}
        <header className="h-16 bg-[var(--bg-header)] backdrop-blur border-b border-[var(--border-color)] flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden text-[var(--text-muted)] hover:text-[var(--text-main)] p-1"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
              <span className="text-[var(--text-muted)]">console</span>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span className="text-[var(--text-main)] font-semibold">{pageTitle.toLowerCase()}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <LiveClock />
            {/* Command / Search Input */}
            <div className="relative hidden sm:flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-3 text-[var(--text-muted)]" />
              <input 
                type="text" 
                placeholder="Search commands, employees (⌘K)..." 
                className="bg-[var(--bg-page)] border border-[var(--border-color)] text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] pl-8 pr-10 py-1.5 rounded-md focus-visible:outline-none focus-visible:border-[var(--color-primary)] w-64 transition-colors"
              />
              <kbd className="absolute right-2.5 text-[10px] font-mono bg-[var(--bg-subtle)] text-[var(--text-muted)] px-1.5 py-0.5 rounded border border-[var(--border-color)] pointer-events-none">
                ⌘K
              </kbd>
            </div>

            {/* Horilla Parity Quick Check-In / Check-Out Widget */}
            <QuickPunchWidget />

            {/* Theme Customizer Palette Trigger */}
            <button 
              onClick={() => setCustomizerOpen(true)}
              className="p-2 text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--bg-subtle)] rounded transition-colors"
              title="Theme & Corporate Brand Customizer"
            >
              <Palette className="h-4 w-4" />
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded hover:bg-[var(--bg-subtle)] transition-colors"
              >
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 block h-2 w-2 rounded-full theme-accent-bg animate-pulse"></span>
                )}
                <Bell className="h-4 w-4" />
              </button>

              {/* Notification Drawer Popover */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg shadow-2xl z-50 overflow-hidden animate-fade-in font-mono text-xs text-[var(--text-main)]">
                  <div className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-subtle)] flex items-center justify-between">
                    <span className="font-semibold text-[var(--text-main)] text-xs">System Alerts ({unreadCount} unread)</span>
                    <button onClick={() => setIsNotifOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-[var(--border-color)]">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-[var(--text-muted)] text-[11px]">No alerts</div>
                    ) : (
                      notifications.map((n: any) => (
                        <div key={n.id} className={`p-3 hover:bg-[var(--bg-subtle)] transition-colors ${!n.is_read ? 'bg-[var(--color-primary)]/5' : ''}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-[var(--text-main)] text-xs truncate max-w-[180px]">{n.title}</span>
                            <span className="text-[10px] theme-accent-text uppercase bg-[var(--color-primary)]/10 px-1 py-0.2 rounded border border-[var(--color-primary)]/20">
                              {n.module}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--text-muted)] leading-tight">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Console Page Area */}
        <div className="flex-1 overflow-auto p-6 animate-fade-in relative z-0">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </div>

        {/* Global Theme & Brand Customizer Drawer */}
        <ThemeCustomizerModal />
      </main>
    </div>
  )
}

const LiveClock = () => {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-[var(--text-muted)] bg-[var(--bg-subtle)] px-2.5 py-1.5 rounded-md border border-[var(--border-color)] whitespace-nowrap">
      <Clock className="w-3.5 h-3.5" />
      <span>{time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
      <span className="opacity-40">|</span>
      <span>{time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
    </div>
  )
}
