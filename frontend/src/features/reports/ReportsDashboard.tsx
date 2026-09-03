import { useQuery } from '@tanstack/react-query'
import { Download, FileSpreadsheet, Users, UserPlus, LogOut, Calendar, Clock, DollarSign } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'

const fetchReportData = async (type: string) => {
  const res = await fetch(`/api/v1/reports/export?type=${type}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('hrms_token') || localStorage.getItem('token')}` }
  })
  if (!res.ok) throw new Error('Failed to fetch report data')
  return res.json()
}

export const ReportsDashboard = () => {
  const [activeReport, setActiveReport] = useState('headcount')
  const { data, isLoading } = useQuery({ 
    queryKey: ['report-data', activeReport], 
    queryFn: () => fetchReportData(activeReport) 
  })

  const handleExportCSV = () => {
    const token = localStorage.getItem('hrms_token') || localStorage.getItem('token')
    const url = `/api/v1/reports/export?type=${activeReport}&format=csv`
    
    // Create direct download trigger
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.blob())
      .then(blob => {
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `${activeReport}_report_${new Date().toISOString().slice(0, 10)}.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()
      })
      .catch(() => alert('CSV Export failed'))
  }

  const report = data?.data || {
    columns: ['Employee ID', 'Name', 'Department', 'Designation', 'Joining Date', 'Status'],
    rows: [
      { employee_id: 'EMP-1024', name: 'Alice Walker', department: 'Engineering', designation: 'Senior Engineer', joining_date: '2024-01-15', status: 'ACTIVE' },
      { employee_id: 'EMP-1088', name: 'Bob Smith', department: 'Design', designation: 'UI Lead', joining_date: '2024-03-01', status: 'ACTIVE' },
      { employee_id: 'EMP-1090', name: 'Carol Danvers', department: 'Product', designation: 'Product Manager', joining_date: '2024-05-10', status: 'ACTIVE' },
      { employee_id: 'EMP-1010', name: 'David Miller', department: 'Sales', designation: 'Sales Executive', joining_date: '2024-06-01', status: 'CONFIRMED' },
    ]
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[var(--text-main)] leading-tight tracking-tight">Standard Reports & CSV Export</h1>
          <p className="text-xs font-mono text-[var(--text-muted)] mt-1">REAL-TIME OPERATIONAL HR INTELLIGENCE & EXPORT ENGINE</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded text-xs font-mono font-semibold transition-all shadow-sm"
        >
          <Download size={14} /> Export Report to CSV
        </button>
      </div>

      {/* Report Selector Tabs */}
      <Tabs.Root value={activeReport} onValueChange={setActiveReport} className="w-full">
        <Tabs.List className="flex border-b border-[var(--border-color)] mb-6 gap-2 font-mono text-xs overflow-x-auto custom-scrollbar">
          {[
            { key: 'headcount', label: 'HEADCOUNT REPORT', icon: Users },
            { key: 'new_joiners', label: 'NEW JOINERS', icon: UserPlus },
            { key: 'exits', label: 'EXITS & SEPARATIONS', icon: LogOut },
            { key: 'attendance', label: 'MONTHLY ATTENDANCE', icon: Calendar },
            { key: 'leave_balance', label: 'LEAVE BALANCES', icon: Clock },
            { key: 'payroll', label: 'PAYROLL REGISTER', icon: DollarSign },
          ].map(t => (
            <Tabs.Trigger
              key={t.key}
              value={t.key}
              className="px-3.5 py-2 text-[var(--text-muted)] hover:text-[var(--text-main)] data-[state=active]:theme-accent-text data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-primary)] transition-colors flex items-center gap-1.5 shrink-0 font-semibold"
            >
              <t.icon size={14} /> {t.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* Report Content Table */}
        <Card className="p-0 overflow-hidden bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
          <div className="px-5 py-3 border-b border-[var(--border-color)] bg-[var(--bg-subtle)] flex items-center justify-between font-mono text-xs">
            <div className="flex items-center gap-2 text-[var(--text-main)] font-semibold">
              <FileSpreadsheet size={15} className="theme-accent-text" />
              <span className="uppercase">{activeReport.replace('_', ' ')} REGISTER</span>
            </div>
            <span className="text-[var(--text-muted)]">{report.rows?.length || 0} TOTAL RECORDS</span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-[var(--text-muted)] font-mono text-xs">Generating report data...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--bg-subtle)] font-mono text-xs text-[var(--text-muted)] uppercase">
                    {report.columns?.map((col: string, idx: number) => (
                      <th key={idx} className="px-5 py-2.5 font-semibold">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)] text-xs font-mono">
                  {report.rows?.map((row: any, rIdx: number) => (
                    <tr key={rIdx} className="hover:bg-[var(--bg-subtle)] transition-colors">
                      {Object.values(row).map((val: any, cIdx: number) => (
                        <td key={cIdx} className="px-5 py-3 text-[var(--text-main)]">
                          {String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </Tabs.Root>
    </div>
  )
}
