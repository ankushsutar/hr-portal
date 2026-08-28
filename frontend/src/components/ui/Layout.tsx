import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { LayoutDashboard, Users, Calendar, Clock, DollarSign, Target, Briefcase, Settings, HelpCircle, LogOut, Bell, UserCheck, Search, Shield, ChevronRight, Cpu, CheckSquare, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EMPLOYEE'] },
  { name: 'Universal Inbox', href: '/inbox', icon: CheckSquare, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EMPLOYEE'] },
  { name: 'HR Task Center', href: '/hr-tasks', icon: Clock, roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
  { name: 'My Attendance', href: '/my/attendance', icon: UserCheck, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EMPLOYEE'] },
  { name: 'People', href: '/employees', icon: Users, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EMPLOYEE'] },
  { name: 'Attendance', href: '/attendance', icon: Calendar, roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
  { name: 'Leave', href: '/leave', icon: Calendar, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EMPLOYEE'] },
  { name: 'Payroll', href: '/payroll', icon: DollarSign, roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
  { name: 'Performance', href: '/performance', icon: Target, roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
  { name: 'Recruitment', href: '/recruitment', icon: Briefcase, roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
  { name: 'Services', href: '/services', icon: HelpCircle, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EMPLOYEE'] },
  { name: 'Organization', href: '/organization', icon: Settings, roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
  { name: 'Administration', href: '/users', icon: Shield, roles: ['SUPER_ADMIN'] },
  { name: 'Onboarding', href: '/onboarding', icon: Settings, roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
  { name: 'Bulk Operations', href: '/import', icon: Cpu, roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
]

export const Layout = () => {
  const { user, logout, hasRole } = useAuth() as any
  const routerState = useRouterState()
  const [isNotifOpen, setIsNotifOpen] = useState(false)

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
    <div className="flex h-screen bg-[#0B0F19] text-slate-100 font-sans overflow-hidden">
      {/* Dark Compact Developer Sidebar */}
      <aside className="w-64 hidden md:flex flex-col bg-[#111827] border-r border-slate-800/80 z-20">
        {/* Console Header */}
        <div className="h-16 flex items-center px-5 border-b border-slate-800/80 bg-[#111827]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center font-mono font-bold text-white text-xs shadow-sm">
              H
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-slate-100 tracking-tight text-sm">HRMS</span>
              <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 uppercase tracking-widest font-semibold">CORE</span>
            </div>
          </div>
        </div>
        
        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 custom-scrollbar">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider px-3 mb-2 font-semibold">
            WORKSPACE
          </div>
          {navigation.filter(item => hasRole(item.roles)).map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="group flex items-center px-3 py-2 text-xs font-medium rounded-md text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition-all duration-150 [&.active]:bg-blue-500/10 [&.active]:text-blue-400 [&.active]:font-semibold [&.active]:border-l-2 [&.active]:border-blue-500"
            >
              <item.icon className="mr-2.5 h-4 w-4 shrink-0 text-slate-500 group-hover:text-slate-300 group-[.active]:text-blue-400 transition-colors" />
              <span className="truncate">{item.name}</span>
            </Link>
          ))}
        </nav>
        
        {/* Bottom User Pill */}
        <div className="p-3 border-t border-slate-800/80 bg-[#0F1523]">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0 pr-2">
              <div className="h-7 w-7 rounded bg-slate-800 border border-slate-700 text-blue-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="ml-2.5 truncate">
                <p className="text-xs font-medium text-slate-200 truncate leading-none">{user?.email}</p>
                <p className="text-[10px] font-mono text-slate-500 truncate mt-1">{user?.roles?.[0] || 'USER'}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Console Workspace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-[#0B0F19]">
        {/* Top Header / Breadcrumb Bar */}
        <header className="h-16 bg-[#111827]/80 backdrop-blur border-b border-slate-800/80 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="text-slate-500">console</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-slate-100 font-semibold">{pageTitle.toLowerCase()}</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Command / Search Input */}
            <div className="relative hidden sm:flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-3 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search commands, employees (⌘K)..." 
                className="bg-[#0B0F19] border border-slate-800 text-xs text-slate-200 placeholder-slate-500 pl-8 pr-10 py-1.5 rounded-md focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 w-64 transition-all"
              />
              <kbd className="absolute right-2.5 text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 pointer-events-none">
                ⌘K
              </kbd>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800/60 transition-colors"
              >
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                )}
                <Bell className="h-4 w-4" />
              </button>

              {/* Notification Drawer Popover */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[#111827] border border-slate-800 rounded-lg shadow-2xl z-50 overflow-hidden animate-fade-in font-mono text-xs">
                  <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
                    <span className="font-semibold text-slate-200 text-xs">System Alerts ({unreadCount} unread)</span>
                    <button onClick={() => setIsNotifOpen(false)} className="text-slate-500 hover:text-slate-300">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-slate-500 text-[11px]">No alerts</div>
                    ) : (
                      notifications.map((n: any) => (
                        <div key={n.id} className={`p-3 hover:bg-slate-800/40 transition-colors ${!n.is_read ? 'bg-blue-500/5' : ''}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-200 text-xs truncate max-w-[180px]">{n.title}</span>
                            <span className="text-[10px] text-blue-400 uppercase bg-blue-500/10 px-1 py-0.2 rounded border border-blue-500/20">
                              {n.module}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-tight">{n.message}</p>
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
      </main>
    </div>
  )
}
