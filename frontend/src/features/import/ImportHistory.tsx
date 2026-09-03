import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { FileSpreadsheet, CheckCircle2, AlertCircle, ArrowLeft, Download } from 'lucide-react'
import { Card } from '../../components/ui/Card'

export const ImportHistory = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['import-batches'],
    queryFn: async () => {
      const res = await fetch('/api/v1/import/batches', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to fetch import history')
      return res.json()
    }
  })

  if (isLoading) return <div className="p-8 font-mono text-xs text-[var(--text-muted)]">Loading batch history...</div>
  if (isError) return <div className="p-8 font-mono text-xs text-rose-500">Failed to load import history.</div>

  const batches = data?.data || []

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div>
        <Link to="/import" className="inline-flex items-center text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors mb-3">
          <ArrowLeft size={14} className="mr-1.5" /> Back to Import Wizard
        </Link>
        <h1 className="text-[28px] font-bold text-[var(--text-main)] leading-tight tracking-tight">Bulk Import Batch History</h1>
        <p className="text-xs font-mono text-[var(--text-muted)] mt-1">HISTORICAL BATCH INGESTION AUDIT & ERROR REPORT DOWNLOADS</p>
      </div>

      <Card className="p-0 overflow-hidden bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border-color)] font-mono text-xs text-[var(--text-muted)] uppercase">
                <th className="px-5 py-2.5 font-semibold">Date & Time</th>
                <th className="px-5 py-2.5 font-semibold">Import Target</th>
                <th className="px-5 py-2.5 text-center font-semibold">Total Rows</th>
                <th className="px-5 py-2.5 text-center font-semibold">Valid</th>
                <th className="px-5 py-2.5 text-center font-semibold">Errors</th>
                <th className="px-5 py-2.5 text-right font-semibold">Status / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] font-mono text-xs text-[var(--text-main)]">
              {batches.map((batch: any) => (
                <tr key={batch.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-[var(--text-main)] text-xs">
                      {new Date(batch.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      {new Date(batch.created_at).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet size={15} className="theme-accent-text" />
                      <span className="text-xs font-semibold text-[var(--text-main)]">{batch.import_type}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-center text-[var(--text-main)] font-bold">{batch.total_rows}</td>
                  <td className="px-5 py-3 text-center">
                    <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      {batch.valid_rows}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded text-[11px] font-bold ${
                      batch.error_rows > 0 
                        ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                        : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-color)]'
                    }`}>
                      {batch.error_rows}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {batch.status === 'COMPLETED' ? (
                      <div className="flex items-center justify-end gap-3">
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-500 uppercase">
                          <CheckCircle2 size={13} /> Completed
                        </span>
                        {batch.error_rows > 0 && (
                          <button className="text-[var(--text-muted)] hover:theme-accent-text transition-colors" title="Download Error Report">
                            <Download size={16} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="flex items-center justify-end gap-1 text-[11px] font-bold text-amber-500 uppercase">
                        <AlertCircle size={13} /> {batch.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {batches.length === 0 && (
            <div className="p-10 text-center font-mono text-xs text-[var(--text-muted)]">
              No previous import batch logs found.
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
