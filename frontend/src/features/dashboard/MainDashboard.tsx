import { useQuery } from '@tanstack/react-query'
import { Users, Briefcase, Clock, DollarSign, TrendingUp, Terminal, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import { Link } from '@tanstack/react-router'
import { Card } from '../../components/ui/Card'

const fetchDashboardData = async () => {
  const res = await fetch('/api/v1/reports/dashboard', {
    headers: { Authorization: `Bearer ${localStorage.getItem('hrms_token') || localStorage.getItem('token')}` }
  })
  if (!res.ok) throw new Error('Failed to fetch dashboard data')
  return res.json()
}

const ActivityFeedWidget = ({ feed }: { feed: any[] }) => (
  <Card className="p-6 flex flex-col h-full">
    <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
      <div className="flex items-center gap-2">
        <Terminal className="w-4 h-4 text-emerald-400" />
        <h3 className="font-semibold text-slate-100 text-sm">Activity Feed</h3>
      </div>
      <span className="text-[10px] font-mono text-slate-500 uppercase">LIVE LOG</span>
    </div>
    <div className="flex-1 space-y-3 font-mono text-xs overflow-y-auto max-h-[220px]">
      {feed?.map((item, idx) => (
        <div key={idx} className="flex items-start gap-2.5 text-slate-300">
          <span className="text-blue-400 shrink-0">{item.time}</span>
          <span className="text-slate-400 leading-snug">{item.text}</span>
        </div>
      ))}
    </div>
  </Card>
)

const AdminDashboardView = ({ metrics }: { metrics: any }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">Total Headcount</p>
          <h3 className="text-3xl font-mono font-bold text-slate-100 mt-1">{metrics?.total_employees || 0}</h3>
          <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1 font-mono">
            <TrendingUp className="w-3.5 h-3.5" /> +2.4% THIS MONTH
          </p>
        </div>
        <div className="w-10 h-10 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
          <Users className="w-5 h-5" />
        </div>
      </Card>
      <Card className="p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">Open Positions</p>
          <h3 className="text-3xl font-mono font-bold text-slate-100 mt-1">{metrics?.open_jobs || 0}</h3>
          <p className="text-xs text-slate-400 mt-1.5 font-mono">ACROSS DEPTS</p>
        </div>
        <div className="w-10 h-10 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
          <Briefcase className="w-5 h-5" />
        </div>
      </Card>
      <Card className="p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">Pending Tasks</p>
          <h3 className="text-3xl font-mono font-bold text-amber-400 mt-1">{metrics?.pending_approvals || 0}</h3>
          <p className="text-xs text-amber-400/80 mt-1.5 font-mono">REQUIRES ACTION</p>
        </div>
        <div className="w-10 h-10 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
          <Clock className="w-5 h-5" />
        </div>
      </Card>
      <Card className="p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">YTD Payroll</p>
          <h3 className="text-3xl font-mono font-bold text-slate-100 mt-1">
            ₹{((metrics?.total_payroll || 0) / 100000).toFixed(1)}L
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 font-mono">PROCESSED CYCLES</p>
        </div>
        <div className="w-10 h-10 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
          <DollarSign className="w-5 h-5" />
        </div>
      </Card>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-slate-100 text-sm">Headcount by Department</h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">ACTIVE FULL-TIME EMPLOYEES</p>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics?.headcount_data || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1F2937" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <RechartsTooltip cursor={{ fill: '#1F2937' }} contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '6px', color: '#F9FAFB', fontSize: '12px' }} />
              <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <ActivityFeedWidget feed={metrics?.activity_feed || []} />
    </div>
  </div>
)

const ManagerDashboardView = ({ metrics }: { metrics: any }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">Team Members</p>
          <h3 className="text-3xl font-mono font-bold text-slate-100 mt-1">{metrics?.total_team_members || 0}</h3>
        </div>
        <div className="w-10 h-10 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
          <Users className="w-5 h-5" />
        </div>
      </Card>
      <Card className="p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">Pending Approvals</p>
          <h3 className="text-3xl font-mono font-bold text-amber-400 mt-1">{metrics?.pending_approvals || 0}</h3>
        </div>
        <div className="w-10 h-10 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
          <Clock className="w-5 h-5" />
        </div>
      </Card>
      <Card className="p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">Team Attendance</p>
          <h3 className="text-3xl font-mono font-bold text-emerald-400 mt-1">{metrics?.team_attendance || 0}%</h3>
        </div>
        <div className="w-10 h-10 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </Card>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-slate-100 text-sm">Team by Designation</h3>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics?.designation_data || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1F2937" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <RechartsTooltip cursor={{ fill: '#1F2937' }} contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '6px', color: '#F9FAFB', fontSize: '12px' }} />
              <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <ActivityFeedWidget feed={metrics?.activity_feed || []} />
    </div>
  </div>
)

const EmployeeDashboardView = ({ metrics }: { metrics: any }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">My Attendance</p>
          <h3 className="text-3xl font-mono font-bold text-emerald-400 mt-1">{metrics?.my_attendance_rate || 0}%</h3>
        </div>
        <div className="w-10 h-10 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </Card>
      <Card className="p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">Casual Leave</p>
          <h3 className="text-3xl font-mono font-bold text-blue-400 mt-1">{metrics?.casual_leave || 0}</h3>
        </div>
        <div className="w-10 h-10 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
          <Briefcase className="w-5 h-5" />
        </div>
      </Card>
      <Card className="p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">Sick Leave</p>
          <h3 className="text-3xl font-mono font-bold text-red-400 mt-1">{metrics?.sick_leave || 0}</h3>
        </div>
        <div className="w-10 h-10 rounded bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
          <AlertCircle className="w-5 h-5" />
        </div>
      </Card>
      <Card className="p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">Pending Requests</p>
          <h3 className="text-3xl font-mono font-bold text-amber-400 mt-1">{metrics?.pending_requests || 0}</h3>
        </div>
        <div className="w-10 h-10 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
          <Clock className="w-5 h-5" />
        </div>
      </Card>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <ActivityFeedWidget feed={metrics?.activity_feed || []} />
      </div>
      <Card className="p-6">
        <h3 className="font-semibold text-slate-100 text-sm mb-4">Quick Actions</h3>
        <div className="space-y-3 flex flex-col">
          <Link to="/attendance" className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded flex justify-between items-center text-sm font-medium transition-colors">
            View Timesheet <ArrowRight size={14} />
          </Link>
          <Link to="/leave" className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded flex justify-between items-center text-sm font-medium transition-colors">
            Apply for Leave <ArrowRight size={14} />
          </Link>
        </div>
      </Card>
    </div>
  </div>
)

export const MainDashboard = () => {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboardData })

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )

  const metrics = data?.data
  const role = data?.role || 'EMPLOYEE'

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-slate-100 leading-tight tracking-tight">
            {role === 'SUPER_ADMIN' || role === 'HR_ADMIN' ? 'HR Operations Overview' : role === 'MANAGER' ? 'Team Overview' : 'My Dashboard'}
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            {role === 'SUPER_ADMIN' || role === 'HR_ADMIN' ? 'REAL-TIME ORGANIZATIONAL METRICS & SYSTEM ACTIVITY' : 'YOUR DASHBOARD'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> SYSTEM LIVE
          </span>
        </div>
      </div>

      {(role === 'SUPER_ADMIN' || role === 'HR_ADMIN') && <AdminDashboardView metrics={metrics} />}
      {role === 'MANAGER' && <ManagerDashboardView metrics={metrics} />}
      {role === 'EMPLOYEE' && <EmployeeDashboardView metrics={metrics} />}

      {/* Quick Navigation Panel */}
      <Card className="p-5">
        <h3 className="text-xs font-mono uppercase text-slate-400 font-semibold mb-4 tracking-wider">OPERATIONAL CONSOLES</h3>
        <div className="flex flex-wrap gap-3">
          <Link to="/employees" className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 px-4 py-2 rounded text-xs font-medium transition-colors">
            People Directory
          </Link>
          <Link to="/attendance" className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 px-4 py-2 rounded text-xs font-medium transition-colors">
            Attendance Logs
          </Link>
          <Link to="/leave" className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 px-4 py-2 rounded text-xs font-medium transition-colors">
            Leave Engine
          </Link>
          <Link to="/payroll" className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 px-4 py-2 rounded text-xs font-medium transition-colors">
            Payroll Processing
          </Link>
          {(role === 'SUPER_ADMIN' || role === 'HR_ADMIN' || role === 'MANAGER') && (
            <Link to="/inbox" className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 px-4 py-2 rounded text-xs font-medium transition-colors">
              Pending Inbox
            </Link>
          )}
        </div>
      </Card>
    </div>
  )
}
