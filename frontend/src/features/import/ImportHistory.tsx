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

  if (isLoading) return <div className="p-8 font-mono text-xs text-slate-500">Loading batch history...</div>
  if (isError) return <div className="p-8 font-mono text-xs text-rose-400">Failed to load import history.</div>

  const batches = data?.data || []

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div>
        <Link to="/import" className="inline-flex items-center text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors mb-3">
          <ArrowLeft size={14} className="mr-1.5" /> Back to Import Wizard
        </Link>
        <h1 className="text-[28px] font-bold text-slate-100 leading-tight tracking-tight">Bulk Import Batch History</h1>
        <p className="text-xs font-mono text-slate-400 mt-1">HISTORICAL BATCH INGESTION AUDIT & ERROR REPORT DOWNLOADS</p>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800 font-mono text-xs text-slate-400 uppercase">
                <th className="px-5 py-2.5">Date & Time</th>
                <th className="px-5 py-2.5">Import Target</th>
                <th className="px-5 py-2.5 text-center">Total Rows</th>
                <th className="px-5 py-2.5 text-center">Valid</th>
                <th className="px-5 py-2.5 text-center">Errors</th>
                <th className="px-5 py-2.5 text-right">Status / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {batches.map((batch: any) => (
                <tr key={batch.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-slate-200 text-xs">
                      {new Date(batch.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {new Date(batch.created_at).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet size={15} className="text-blue-400" />
                      <span className="text-xs font-semibold text-slate-300">{batch.import_type}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-center text-slate-200 font-bold">{batch.total_rows}</td>
                  <td className="px-5 py-3 text-center">
                    <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {batch.valid_rows}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded text-[11px] font-bold ${
                      batch.error_rows > 0 
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {batch.error_rows}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {batch.status === 'COMPLETED' ? (
                      <div className="flex items-center justify-end gap-3">
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 uppercase">
                          <CheckCircle2 size={13} /> Completed
                        </span>
                        {batch.error_rows > 0 && (
                          <button className="text-slate-400 hover:text-blue-400 transition-colors" title="Download Error Report">
                            <Download size={16} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="flex items-center justify-end gap-1 text-[11px] font-bold text-amber-400 uppercase">
                        <AlertCircle size={13} /> {batch.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {batches.length === 0 && (
            <div className="p-10 text-center font-mono text-xs text-slate-500">
              No previous import batch logs found.
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
