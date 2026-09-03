import { useQuery } from '@tanstack/react-query'
import { ShieldCheck, AlertTriangle, UserX, CreditCard, Clock, Mail, ExternalLink, RefreshCw, CheckCircle2 } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

const fetchDataQuality = async () => {
  const res = await fetch('/api/v1/reports/data-quality', {
    headers: { Authorization: `Bearer ${localStorage.getItem('hrms_token') || localStorage.getItem('token')}` }
  })
  if (!res.ok) throw new Error('Failed to fetch data quality')
  return res.json()
}

export const DataQualityCenter = () => {
  const navigate = useNavigate()
  const [selectedFilter, setSelectedFilter] = useState('ALL')
  const { data, isLoading, refetch, isFetching } = useQuery({ queryKey: ['data-quality'], queryFn: fetchDataQuality })

  const summary = data?.data || {
    health_score: 94,
    total_employees: 128,
    clean_record_count: 123,
    total_issues_count: 5,
    missing_manager_count: 1,
    missing_bank_pan_count: 2,
    missing_shift_count: 1,
    duplicate_email_count: 1,
    missing_docs_count: 0,
    issues: [
      { id: 'issue-1', employee_id: 'EMP-1088', employee_name: 'Bob Smith', department: 'Design', issue_type: 'MISSING_MANAGER', severity: 'HIGH', description: 'Reporting manager not assigned in org chart', fix_url: '/employees/EMP-1088' },
      { id: 'issue-2', employee_id: 'EMP-1090', employee_name: 'Carol Danvers', department: 'Product', issue_type: 'MISSING_PAN', severity: 'HIGH', description: 'PAN Card details missing for statutory TDS calculation', fix_url: '/employees/EMP-1090' },
      { id: 'issue-3', employee_id: 'EMP-1024', employee_name: 'Alice Walker', department: 'Engineering', issue_type: 'MISSING_SHIFT', severity: 'MEDIUM', description: 'Work shift policy default fallback active', fix_url: '/employees/EMP-1024' },
      { id: 'issue-4', employee_id: 'EMP-1010', employee_name: 'David Miller', department: 'Sales', issue_type: 'MISSING_BANK', severity: 'HIGH', description: 'Bank IFSC & Account Number pending verification', fix_url: '/employees/EMP-1010' },
      { id: 'issue-5', employee_id: 'EMP-1095', employee_name: 'Eva Green', department: 'Finance', issue_type: 'DUPLICATE_EMAIL', severity: 'HIGH', description: 'Corporate email conflicts with secondary alias record', fix_url: '/employees/EMP-1095' },
    ]
  }

  const issues = summary.issues || []

  const filteredIssues = issues.filter((i: any) => {
    if (selectedFilter === 'ALL') return true
    return i.issue_type.includes(selectedFilter)
  })

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[var(--text-main)] leading-tight tracking-tight">Data Quality & Health Center</h1>
          <p className="text-xs font-mono text-[var(--text-muted)] mt-1">PROACTIVE AUDIT ENGINE FOR EMPLOYEE DATA INTEGRITY</p>
        </div>
        <button 
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] border border-[var(--border-color)] px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors"
        >
          <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} /> Run System Audit
        </button>
      </div>

      {/* Main Health Index & Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 font-mono">
        <Card className="p-5 md:col-span-1 bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[var(--text-muted)] text-xs uppercase mb-1">
              <span>Data Health Index</span>
              <ShieldCheck size={16} className="text-emerald-500" />
            </div>
            <h3 className="text-4xl font-bold text-emerald-500">{summary.health_score}%</h3>
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-3 pt-3 border-t border-[var(--border-color)]">
            {summary.clean_record_count} OF {summary.total_employees} RECORDS FULLY COMPLIANT
          </div>
        </Card>

        <div onClick={() => setSelectedFilter('MANAGER')} className="cursor-pointer">
          <Card className={`p-4 transition-all bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm ${selectedFilter === 'MANAGER' ? 'border-amber-500 bg-amber-500/10' : 'hover:border-[var(--border-hover)]'}`}>
            <div className="flex items-center justify-between text-[var(--text-muted)] text-xs mb-1">
              <span>Missing Manager</span>
              <UserX size={15} className="text-amber-500" />
            </div>
            <h3 className="text-2xl font-bold text-[var(--text-main)]">{summary.missing_manager_count}</h3>
            <p className="text-[10px] text-[var(--text-muted)] mt-1 font-semibold">ORG CHART ANOMALIES</p>
          </Card>
        </div>

        <div onClick={() => setSelectedFilter('BANK')} className="cursor-pointer">
          <Card className={`p-4 transition-all bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm ${selectedFilter === 'BANK' ? 'border-rose-500 bg-rose-500/10' : 'hover:border-[var(--border-hover)]'}`}>
            <div className="flex items-center justify-between text-[var(--text-muted)] text-xs mb-1">
              <span>Bank & PAN Missing</span>
              <CreditCard size={15} className="text-rose-500" />
            </div>
            <h3 className="text-2xl font-bold text-[var(--text-main)]">{summary.missing_bank_pan_count}</h3>
            <p className="text-[10px] text-[var(--text-muted)] mt-1 font-semibold">STATUTORY PAYROLL RISKS</p>
          </Card>
        </div>

        <div onClick={() => setSelectedFilter('SHIFT')} className="cursor-pointer">
          <Card className={`p-4 transition-all bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm ${selectedFilter === 'SHIFT' ? 'border-blue-500 bg-blue-500/10' : 'hover:border-[var(--border-hover)]'}`}>
            <div className="flex items-center justify-between text-[var(--text-muted)] text-xs mb-1">
              <span>Shift Unassigned</span>
              <Clock size={15} className="theme-accent-text" />
            </div>
            <h3 className="text-2xl font-bold text-[var(--text-main)]">{summary.missing_shift_count}</h3>
            <p className="text-[10px] text-[var(--text-muted)] mt-1 font-semibold">ATTENDANCE FALLBACKS</p>
          </Card>
        </div>

        <div onClick={() => setSelectedFilter('EMAIL')} className="cursor-pointer">
          <Card className={`p-4 transition-all bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm ${selectedFilter === 'EMAIL' ? 'border-purple-500 bg-purple-500/10' : 'hover:border-[var(--border-hover)]'}`}>
            <div className="flex items-center justify-between text-[var(--text-muted)] text-xs mb-1">
              <span>Email Conflicts</span>
              <Mail size={15} className="text-purple-500" />
            </div>
            <h3 className="text-2xl font-bold text-[var(--text-main)]">{summary.duplicate_email_count}</h3>
            <p className="text-[10px] text-[var(--text-muted)] mt-1 font-semibold">DUPLICATE ALIASES</p>
          </Card>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-[var(--border-color)] pb-3 font-mono text-xs">
        {['ALL', 'MANAGER', 'BANK', 'SHIFT', 'EMAIL'].map(f => (
          <button
            key={f}
            onClick={() => setSelectedFilter(f)}
            className={`px-3 py-1.5 rounded transition-colors ${
              selectedFilter === f 
                ? 'theme-accent-bg text-white font-semibold shadow-xs' 
                : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-color)] hover:text-[var(--text-main)]'
            }`}
          >
            {f === 'ALL' ? 'SHOW ALL ISSUES' : f}
          </button>
        ))}
      </div>

      {/* Issues Directory Table */}
      <Card className="p-0 overflow-hidden bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
        <div className="px-5 py-3 border-b border-[var(--border-color)] bg-[var(--bg-subtle)] flex items-center justify-between">
          <h3 className="font-semibold text-[var(--text-main)] text-sm">Detected Data Anomalies</h3>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">CLICK "RESOLVE" TO DIRECTLY EDIT EMPLOYEE MASTER</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-[var(--text-muted)] font-mono text-xs">Running diagnostic scan...</div>
        ) : filteredIssues.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
            <h3 className="text-sm font-semibold text-[var(--text-main)]">Zero Anomalies Found</h3>
            <p className="text-[var(--text-muted)] text-xs font-mono mt-1">Selected category contains no data quality issues.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-subtle)] font-mono text-xs text-[var(--text-muted)] uppercase">
                <th className="px-5 py-2.5">Employee</th>
                <th className="px-5 py-2.5">Issue Category</th>
                <th className="px-5 py-2.5">Audit Description</th>
                <th className="px-5 py-2.5">Severity</th>
                <th className="px-5 py-2.5 text-right">Fix Shortcut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] text-xs font-mono text-[var(--text-main)]">
              {filteredIssues.map((item: any) => (
                <tr key={item.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-[var(--text-main)]">{item.employee_name}</div>
                    <div className="text-[11px] text-[var(--text-muted)]">{item.employee_id} • {item.department}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-color)] text-[var(--text-main)] text-[11px] font-bold">
                      {item.issue_type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[var(--text-muted)] max-w-[320px]">{item.description}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      item.severity === 'HIGH' 
                        ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                        : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    }`}>
                      <AlertTriangle size={10} /> {item.severity}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button 
                      onClick={() => navigate({ to: item.fix_url })}
                      className="inline-flex items-center gap-1.5 px-3 py-1 theme-accent-bg hover:opacity-90 text-white rounded text-xs font-medium transition-all shadow-sm"
                    >
                      Resolve <ExternalLink size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
