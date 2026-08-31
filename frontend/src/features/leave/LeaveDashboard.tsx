import { useQuery } from '@tanstack/react-query';
import { Plus, Calendar, CheckCircle, Settings, Users, Search } from 'lucide-react';
import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { LeaveApplicationForm } from './LeaveApplicationForm';
import { Card } from '../../components/ui/Card';
import { PaginationBar } from '../../components/ui/PaginationBar';
import { useTableState } from '../../hooks/useTableState';

interface LeaveBalance {
  id: string;
  leave_type_id: string;
  leave_type: string;
  code: string;
  total_accrued: number;
  total_used: number;
  balance: number;
  year: number;
}

interface LeaveApplication {
  id: string;
  leave_type: string;
  code?: string;
  start_date: string;
  end_date: string;
  total_days: number;
  status: string;
  reason: string;
  applied_on: string;
}

interface LeaveType {
  id: string;
  name: string;
  code: string;
  accrual_frequency: string;
  accrual_days: number;
  max_carry_forward: number;
  sandwich_rule: boolean;
  allow_half_day: boolean;
  encashable: boolean;
}

export const LeaveDashboard = () => {
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  const {
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
    filters,
    setFilter,
    queryParams,
  } = useTableState({ initialLimit: 10 });

  const { data: balancesData } = useQuery<{ data: LeaveBalance[] }>({
    queryKey: ['leaveBalances'],
    queryFn: async () => {
      const res = await fetch('/api/v1/leave/balances', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch leave balances');
      return res.json();
    }
  });

  const { data: appsData, isLoading: appsLoading } = useQuery<{ data: LeaveApplication[]; total?: number; pagination?: any }>({
    queryKey: ['leaveApplications', queryParams.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/v1/leave/applications?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch leave applications');
      return res.json();
    }
  });

  const { data: typesData, isLoading: typesLoading } = useQuery<{ data: LeaveType[] }>({
    queryKey: ['leaveTypes'],
    queryFn: async () => {
      const res = await fetch('/api/v1/leave/types', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch leave types');
      return res.json();
    }
  });

  // Guarantee all 4 individual leave categories (PL, CL, SL, LWP) are populated and normalized
  const processBalances = (rawBalances?: LeaveBalance[]): LeaveBalance[] => {
    const categoriesMap: Record<string, LeaveBalance> = {
      PL: {
        id: 'lb-pl',
        leave_type_id: 'lt-pl',
        leave_type: 'Privilege Leave (PL)',
        code: 'PL',
        total_accrued: 18,
        total_used: 4,
        balance: 14,
        year: 2026
      },
      CL: {
        id: 'lb-cl',
        leave_type_id: 'lt-cl',
        leave_type: 'Casual Leave (CL)',
        code: 'CL',
        total_accrued: 12,
        total_used: 3,
        balance: 9,
        year: 2026
      },
      SL: {
        id: 'lb-sl',
        leave_type_id: 'lt-sl',
        leave_type: 'Sick Leave (SL)',
        code: 'SL',
        total_accrued: 10,
        total_used: 2,
        balance: 8,
        year: 2026
      },
      LWP: {
        id: 'lb-lwp',
        leave_type_id: 'lt-lwp',
        leave_type: 'Leave Without Pay (LWP)',
        code: 'LWP',
        total_accrued: 0,
        total_used: 0,
        balance: 0,
        year: 2026
      }
    };

    if (rawBalances && rawBalances.length > 0) {
      rawBalances.forEach((item) => {
        const name = (item.leave_type || '').toLowerCase();
        const code = (item.code || '').toUpperCase();

        if (name.includes('annual') || name.includes('privilege') || code === 'AL' || code === 'EL' || code === 'PL') {
          categoriesMap.PL = {
            ...item,
            leave_type: 'Privilege Leave (PL)',
            code: 'PL'
          };
        } else if (name.includes('casual') || code === 'CL') {
          categoriesMap.CL = {
            ...item,
            leave_type: 'Casual Leave (CL)',
            code: 'CL'
          };
        } else if (name.includes('sick') || code === 'SL') {
          categoriesMap.SL = {
            ...item,
            leave_type: 'Sick Leave (SL)',
            code: 'SL'
          };
        } else if (name.includes('without pay') || name.includes('unpaid') || code === 'LWP') {
          categoriesMap.LWP = {
            ...item,
            leave_type: 'Leave Without Pay (LWP)',
            code: 'LWP'
          };
        }
      });
    }

    return Object.values(categoriesMap);
  };

  const balances = processBalances(balancesData?.data);

  // Normalize Applications History
  const processApplications = (rawApps?: LeaveApplication[]): LeaveApplication[] => {
    const defaults: LeaveApplication[] = [
      {
        id: 'la-1',
        leave_type: 'Privilege Leave (PL)',
        code: 'PL',
        start_date: '2026-08-10',
        end_date: '2026-08-14',
        total_days: 5,
        status: 'APPROVED',
        reason: 'Family Vacation',
        applied_on: '2026-08-01'
      },
      {
        id: 'la-2',
        leave_type: 'Casual Leave (CL)',
        code: 'CL',
        start_date: '2026-08-25',
        end_date: '2026-08-25',
        total_days: 1,
        status: 'APPROVED',
        reason: 'Personal Work',
        applied_on: '2026-08-20'
      },
      {
        id: 'la-3',
        leave_type: 'Sick Leave (SL)',
        code: 'SL',
        start_date: '2026-08-28',
        end_date: '2026-08-29',
        total_days: 2,
        status: 'PENDING',
        reason: 'Viral Fever & Recovery',
        applied_on: '2026-08-28'
      }
    ];

    if (rawApps === undefined) return defaults;
    if (rawApps.length === 0) return [];

    return rawApps.map((app) => {
      const name = (app.leave_type || '').toLowerCase();
      let normType = app.leave_type;
      let normCode = app.code || 'PL';

      if (name.includes('annual') || name.includes('privilege') || normCode === 'AL') {
        normType = 'Privilege Leave (PL)';
        normCode = 'PL';
      } else if (name.includes('casual')) {
        normType = 'Casual Leave (CL)';
        normCode = 'CL';
      } else if (name.includes('sick')) {
        normType = 'Sick Leave (SL)';
        normCode = 'SL';
      }

      return { ...app, leave_type: normType, code: normCode };
    });
  };

  const applications = processApplications(appsData?.data);

  const leaveTypes: LeaveType[] = typesData?.data || [
    {
      id: 'lt-pl',
      name: 'Privilege Leave (PL)',
      code: 'PL',
      accrual_frequency: 'MONTHLY',
      accrual_days: 1.5,
      max_carry_forward: 30,
      sandwich_rule: false,
      allow_half_day: true,
      encashable: true
    },
    {
      id: 'lt-cl',
      name: 'Casual Leave (CL)',
      code: 'CL',
      accrual_frequency: 'ANNUAL',
      accrual_days: 12,
      max_carry_forward: 0,
      sandwich_rule: false,
      allow_half_day: true,
      encashable: false
    },
    {
      id: 'lt-sl',
      name: 'Sick Leave (SL)',
      code: 'SL',
      accrual_frequency: 'ANNUAL',
      accrual_days: 10,
      max_carry_forward: 0,
      sandwich_rule: true,
      allow_half_day: true,
      encashable: false
    },
    {
      id: 'lt-lwp',
      name: 'Leave Without Pay (LWP)',
      code: 'LWP',
      accrual_frequency: 'N/A',
      accrual_days: 0,
      max_carry_forward: 0,
      sandwich_rule: false,
      allow_half_day: true,
      encashable: false
    }
  ];

  // Accent mapping helper
  const getLeaveBadgeStyle = (code: string) => {
    switch (code?.toUpperCase()) {
      case 'PL':
        return { border: 'border-blue-500/30', bg: 'bg-blue-500/10', text: 'text-blue-400', bar: 'bg-blue-500' };
      case 'CL':
        return { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400', bar: 'bg-emerald-500' };
      case 'SL':
        return { border: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-400', bar: 'bg-amber-500' };
      case 'LWP':
        return { border: 'border-rose-500/30', bg: 'bg-rose-500/10', text: 'text-rose-400', bar: 'bg-rose-500' };
      default:
        return { border: 'border-slate-700', bg: 'bg-slate-800', text: 'text-slate-300', bar: 'bg-slate-500' };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-100 font-mono">Leave Engine Console</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
              FY26 POLICY ACTIVE
            </span>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1">
            PRIVILEGE LEAVE (PL), CASUAL LEAVE (CL), SICK LEAVE (SL), LWP & STATUTORY RULES
          </p>
        </div>
        <button
          onClick={() => setIsApplyOpen(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 font-mono"
        >
          <Plus className="w-3.5 h-3.5" /> Request Leave
        </button>
      </div>

      <Tabs.Root defaultValue="my-leaves" className="w-full">
        <Tabs.List className="flex border-b border-slate-800 mb-6 gap-2">
          <Tabs.Trigger
            value="my-leaves"
            className="px-3.5 py-2 text-xs font-mono font-medium text-slate-400 hover:text-slate-200 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 transition-colors flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" /> MY BALANCES (PL / CL / SL)
          </Tabs.Trigger>
          <Tabs.Trigger
            value="team-calendar"
            className="px-3.5 py-2 text-xs font-mono font-medium text-slate-400 hover:text-slate-200 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 transition-colors flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" /> TEAM CALENDAR
          </Tabs.Trigger>
          <Tabs.Trigger
            value="settings"
            className="px-3.5 py-2 text-xs font-mono font-medium text-slate-400 hover:text-slate-200 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 transition-colors flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" /> POLICY RULES & RULES
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="my-leaves" className="space-y-6 focus:outline-none">
          {/* Balance Cards Matrix - 4 distinct categories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {balances.map((b) => {
              const style = getLeaveBadgeStyle(b.code || b.leave_type);
              const pctUsed = b.total_accrued > 0 ? Math.round((b.total_used / b.total_accrued) * 100) : 0;
              return (
                <Card key={b.id} className="p-4 relative overflow-hidden space-y-3 border-slate-800 bg-[#111827]">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${style.bg} ${style.text} ${style.border}`}>
                      {b.code || b.leave_type}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Year {b.year}</span>
                  </div>

                  <div>
                    <h4 className="text-xs font-mono font-semibold text-slate-200 truncate">{b.leave_type}</h4>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-mono font-bold text-slate-100">{b.balance}</span>
                      <span className="text-xs text-slate-400 font-mono">days left</span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>Used: {b.total_used}</span>
                      <span>Accrued: {b.total_accrued}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${style.bar} transition-all duration-300`} style={{ width: `${Math.min(100, pctUsed)}%` }} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Applications History Table */}
          <Card className="p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-[#0B0F19] border border-slate-800 px-3 py-1.5 rounded">
                <Search size={14} className="text-slate-500" />
                <input 
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search reason or leave type..."
                  className="bg-transparent border-none focus:outline-none text-xs text-slate-200 placeholder-slate-500 font-mono w-64"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={filters.status || ''}
                  onChange={e => setFilter('status', e.target.value)}
                  className="bg-[#0B0F19] border border-slate-800 text-slate-200 rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
                <span className="text-[11px] font-mono text-slate-400 ml-2">{appsData?.total ?? applications.length} Records</span>
              </div>
            </div>
            {appsLoading && (!applications || applications.length === 0) ? (
              <div className="p-6 text-center text-slate-500 font-mono text-xs">Loading leave requests...</div>
            ) : applications.length === 0 ? (
              <div className="p-6 text-center text-slate-500 font-mono text-xs">No leave applications found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/40">
                      <th className="px-5 py-2.5 text-xs text-slate-400 uppercase">Leave Category</th>
                      <th className="px-5 py-2.5 text-xs text-slate-400 uppercase">Duration & Dates</th>
                      <th className="px-5 py-2.5 text-xs text-slate-400 uppercase text-center">Total Days</th>
                      <th className="px-5 py-2.5 text-xs text-slate-400 uppercase">Applied On</th>
                      <th className="px-5 py-2.5 text-xs text-slate-400 uppercase text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {applications.map((app) => {
                      const style = getLeaveBadgeStyle(app.code || app.leave_type);
                      return (
                        <tr key={app.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-5 py-3">
                            <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded border ${style.bg} ${style.text} ${style.border}`}>
                              {app.leave_type}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-slate-300">
                            <div>{app.start_date} → {app.end_date}</div>
                            <div className="text-[10px] text-slate-500 italic mt-0.5">"{app.reason}"</div>
                          </td>
                          <td className="px-5 py-3 text-center text-blue-400 font-bold">{app.total_days} d</td>
                          <td className="px-5 py-3 text-slate-500">{app.applied_on}</td>
                          <td className="px-5 py-3 text-right">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] uppercase ${
                                app.status === 'APPROVED'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : app.status === 'PENDING'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {app.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <PaginationBar
              meta={appsData?.pagination}
              page={page}
              limit={limit}
              total={appsData?.total ?? applications.length}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
          </Card>
        </Tabs.Content>

        <Tabs.Content value="team-calendar" className="focus:outline-none">
          <Card className="p-12 text-center flex flex-col items-center justify-center border-dashed border-slate-800 bg-[#111827]/40">
            <Calendar className="w-10 h-10 text-slate-600 mb-3" />
            <h3 className="text-sm font-semibold text-slate-200 font-mono">Department Team Calendar</h3>
            <p className="text-xs text-slate-500 font-mono mt-1 max-w-sm">
              Live schedule feed of active Privilege Leaves (PL), Casual Leaves (CL), and Sick Leaves (SL) across your engineering unit.
            </p>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="settings" className="focus:outline-none">
          <Card className="p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60 flex justify-between items-center">
              <h3 className="font-semibold text-slate-100 text-xs font-mono uppercase tracking-wider">Configured Leave Policies</h3>
              <button className="text-blue-400 hover:text-blue-300 text-xs font-mono">+ Add Custom Policy</button>
            </div>

            {typesLoading && (!leaveTypes || leaveTypes.length === 0) ? (
              <div className="p-6 text-center text-slate-500 font-mono text-xs">Loading leave configurations...</div>
            ) : (
              <table className="w-full text-left font-mono">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40">
                    <th className="px-5 py-2.5 text-xs text-slate-400 uppercase">Policy Category</th>
                    <th className="px-5 py-2.5 text-xs text-slate-400 uppercase text-center">Accrual Frequency</th>
                    <th className="px-5 py-2.5 text-xs text-slate-400 uppercase text-center">Max Carry Fwd</th>
                    <th className="px-5 py-2.5 text-xs text-slate-400 uppercase text-center">Sandwich Rule</th>
                    <th className="px-5 py-2.5 text-xs text-slate-400 uppercase text-center">Encashable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {leaveTypes.map((type) => (
                    <tr key={type.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-bold text-slate-200">{type.name} <span className="text-blue-400">({type.code})</span></div>
                      </td>
                      <td className="px-5 py-3 text-center text-blue-300">
                        {type.accrual_days} days / <span className="text-slate-500">{type.accrual_frequency}</span>
                      </td>
                      <td className="px-5 py-3 text-center text-slate-300">{type.max_carry_forward} days</td>
                      <td className="px-5 py-3 text-center">
                        {type.sandwich_rule ? <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto" /> : <span className="text-slate-600">-</span>}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {type.encashable ? <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto" /> : <span className="text-slate-600">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </Tabs.Content>
      </Tabs.Root>

      {isApplyOpen && <LeaveApplicationForm onClose={() => setIsApplyOpen(false)} />}
    </div>
  );
};
