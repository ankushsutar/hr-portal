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

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading dashboard metrics...</div>

  const metrics = data?.data

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center border-b border-gray-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">HR Analytics Overview</h2>
          <p className="text-gray-500 mt-1">Key metrics and insights for your organization.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Employees</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{metrics?.total_employees}</h3>
            <p className="text-sm text-green-600 mt-1 flex items-center gap-1"><TrendingUp className="w-4 h-4" /> +2% this month</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Open Jobs</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{metrics?.open_jobs}</h3>
            <p className="text-sm text-gray-400 mt-1">Across 3 departments</p>
          </div>
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{metrics?.pending_approvals}</h3>
            <p className="text-sm text-yellow-600 mt-1 flex items-center gap-1">Requires attention</p>
          </div>
          <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-lg flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Payroll (YTD)</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">₹{(metrics?.total_payroll / 100000).toFixed(1)}L</h3>
            <p className="text-sm text-gray-400 mt-1">Processed successfully</p>
          </div>
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Headcount by Department</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.headcount_data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <RechartsTooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Hiring vs Attrition Trends</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics?.attrition_data}>
                <defs>
                  <linearGradient id="colorHired" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAttr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="hired" stroke="#10B981" fillOpacity={1} fill="url(#colorHired)" strokeWidth={2} name="New Hires" />
                <Area type="monotone" dataKey="attrition" stroke="#EF4444" fillOpacity={1} fill="url(#colorAttr)" strokeWidth={2} name="Attrition" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Quick Actions Row */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <Link to="/employees" className="bg-white border border-gray-200 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:text-indigo-600 hover:border-indigo-300 transition-colors shadow-sm">
            View All Employees
          </Link>
          <Link to="/recruitment" className="bg-white border border-gray-200 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:text-indigo-600 hover:border-indigo-300 transition-colors shadow-sm">
            Manage Open Jobs
          </Link>
          <Link to="/payroll" className="bg-white border border-gray-200 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:text-indigo-600 hover:border-indigo-300 transition-colors shadow-sm">
            Process Payroll
          </Link>
          <Link to="/inbox" className="bg-white border border-gray-200 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:text-indigo-600 hover:border-indigo-300 transition-colors shadow-sm relative">
            Pending Approvals
            {metrics?.pending_approvals > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {metrics.pending_approvals}
              </span>
            )}
          </Link>
        </div>
      </div>
    </div>
  )
}
