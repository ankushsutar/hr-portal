import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { LayoutDashboard, Users, Calendar, Clock, DollarSign, Target, Briefcase, Settings, HelpCircle, LogOut, Bell, UserCheck } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EMPLOYEE'] },
  { name: 'Inbox', href: '/inbox', icon: Clock, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EMPLOYEE'] },
  { name: 'My Attendance', href: '/my/attendance', icon: UserCheck, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EMPLOYEE'] },
  { name: 'Employees', href: '/employees', icon: Users, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EMPLOYEE'] },
  { name: 'Attendance', href: '/attendance', icon: Calendar, roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
  { name: 'Leave', href: '/leave', icon: Calendar, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EMPLOYEE'] },
  { name: 'Payroll', href: '/payroll', icon: DollarSign, roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
  { name: 'Performance', href: '/performance', icon: Target, roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
  { name: 'Recruitment', href: '/recruitment', icon: Briefcase, roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
  { name: 'Services', href: '/services', icon: HelpCircle, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'EMPLOYEE'] },
  { name: 'Organization', href: '/organization', icon: Settings, roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
  { name: 'Users', href: '/users', icon: Settings, roles: ['SUPER_ADMIN'] },
  { name: 'Onboarding', href: '/onboarding', icon: Settings, roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
  { name: 'Import', href: '/import', icon: Settings, roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
]

export const Layout = () => {
  const { user, logout, hasRole } = useAuth() as any
  const routerState = useRouterState()
  
  // Try to find the title from navigation, default to Overview
  const currentNav = navigation.find(n => n.href === routerState.location.pathname) || 
                     navigation.find(n => routerState.location.pathname.startsWith(n.href) && n.href !== '/')
  const pageTitle = currentNav ? currentNav.name : 'Overview'

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-gray-900 font-sans overflow-hidden">
      {/* Floating Sidebar */}
      <aside className="w-72 hidden md:flex flex-col m-4 mr-0 rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden relative z-20">
        <div className="h-20 flex items-center px-8 border-b border-gray-50/50 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg leading-none">H</span>
            </div>
            <div className="text-xl font-heading font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              HRMS Pro
            </div>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
          <ul className="space-y-1.5">
            {navigation.filter(item => hasRole(item.roles)).map((item) => (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className="group flex items-center px-4 py-3 text-sm font-medium rounded-xl text-gray-600 hover:bg-indigo-50/80 hover:text-indigo-700 transition-all duration-200 [&.active]:bg-gradient-to-r [&.active]:from-indigo-50 [&.active]:to-purple-50 [&.active]:text-indigo-700 [&.active]:shadow-sm [&.active]:font-semibold [&.active]:border [&.active]:border-indigo-100/50"
                >
                  <item.icon className="mr-3.5 h-5 w-5 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200" />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 m-4 mt-0 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center truncate">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 flex items-center justify-center font-bold ring-2 ring-white shadow-sm">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="ml-3 truncate">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.email}</p>
                <p className="text-xs text-gray-500 font-medium truncate">{user?.roles?.[0]}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="ml-2 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Glass Header */}
        <header className="h-20 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 flex items-center justify-between px-10 sticky top-0 z-10 supports-[backdrop-filter]:bg-white/40">
          <div className="flex items-center">
            <h1 className="text-2xl font-heading font-bold text-gray-800 tracking-tight">{pageTitle}</h1>
          </div>
          <div className="flex items-center space-x-5">
            <button className="relative p-2.5 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors">
              <span className="absolute top-2.5 right-2.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8 animate-fade-in relative z-0">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
