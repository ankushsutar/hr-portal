import { useQuery } from '@tanstack/react-query'
import { Users, Briefcase, Clock, DollarSign, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { Link } from '@tanstack/react-router'

const fetchDashboardData = async () => {
  const res = await fetch('http://localhost:8080/api/v1/reports/dashboard')
  if (!res.ok) throw new Error('Failed to fetch dashboard data')
  return res.json()
}

export const MainDashboard = () => {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboardData })

  if (isLoading) return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  )

  const metrics = data?.data

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in">
      <div className="flex justify-between items-center pb-2">
        <div>
          <h2 className="text-3xl font-heading font-extrabold text-gray-900 tracking-tight">HR Analytics Overview</h2>
          <p className="text-gray-500 mt-2 font-medium">Key metrics and insights for your organization.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-1 hover:border-indigo-100 transition-all duration-300 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Employees</p>
            <h3 className="text-4xl font-heading font-bold text-gray-900 mt-2">{metrics?.total_employees}</h3>
            <p className="text-sm font-medium text-emerald-600 mt-2 flex items-center gap-1"><TrendingUp className="w-4 h-4" /> +2% this month</p>
          </div>
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
            <Users className="w-7 h-7" />
          </div>
        </div>

        <div className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-1 hover:border-purple-100 transition-all duration-300 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Open Jobs</p>
            <h3 className="text-4xl font-heading font-bold text-gray-900 mt-2">{metrics?.open_jobs}</h3>
            <p className="text-sm font-medium text-gray-400 mt-2">Across 3 departments</p>
          </div>
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
            <Briefcase className="w-7 h-7" />
          </div>
        </div>

        <div className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-1 hover:border-amber-100 transition-all duration-300 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Pending Approvals</p>
            <h3 className="text-4xl font-heading font-bold text-gray-900 mt-2">{metrics?.pending_approvals}</h3>
            <p className="text-sm font-medium text-amber-600 mt-2 flex items-center gap-1">Requires attention</p>
          </div>
          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform duration-300">
            <Clock className="w-7 h-7" />
          </div>
        </div>

        <div className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-1 hover:border-emerald-100 transition-all duration-300 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Payroll (YTD)</p>
            <h3 className="text-4xl font-heading font-bold text-gray-900 mt-2">₹{(metrics?.total_payroll / 100000).toFixed(1)}L</h3>
            <p className="text-sm font-medium text-gray-400 mt-2">Processed successfully</p>
          </div>
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
            <DollarSign className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-heading font-bold text-gray-900">Headcount by Department</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.headcount_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 13, fontWeight: 500 }} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 13 }} />
                <RechartsTooltip cursor={{ fill: '#F9FAFB' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', padding: '12px 16px', fontWeight: 600 }} />
                <Bar dataKey="count" fill="url(#colorCount)" radius={[6, 6, 0, 0]} barSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-heading font-bold text-gray-900">Hiring vs Attrition Trends</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics?.attrition_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHired" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAttr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 13, fontWeight: 500 }} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 13 }} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px 16px', fontWeight: 600 }} />
                <Area type="monotone" dataKey="hired" stroke="#10B981" fillOpacity={1} fill="url(#colorHired)" strokeWidth={3} name="New Hires" activeDot={{ r: 6, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="attrition" stroke="#EF4444" fillOpacity={1} fill="url(#colorAttr)" strokeWidth={3} name="Attrition" activeDot={{ r: 6, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Quick Actions Row */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100/50 rounded-3xl p-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <h3 className="text-xl font-heading font-bold text-gray-900 mb-6">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <Link to="/employees" className="bg-white border border-gray-100 px-6 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:text-indigo-600 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            View All Employees
          </Link>
          <Link to="/recruitment" className="bg-white border border-gray-100 px-6 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:text-indigo-600 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            Manage Open Jobs
          </Link>
          <Link to="/payroll" className="bg-white border border-gray-100 px-6 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:text-indigo-600 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            Process Payroll
          </Link>
          <Link to="/inbox" className="bg-white border border-gray-100 px-6 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:text-indigo-600 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative">
            Pending Approvals
            {metrics?.pending_approvals > 0 && (
              <span className="absolute -top-2.5 -right-2.5 bg-red-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md shadow-red-500/30">
                {metrics.pending_approvals}
              </span>
            )}
          </Link>
        </div>
      </div>
    </div>
  )
}
