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

  if (isLoading) return <div className="p-8 text-gray-500">Loading history...</div>
  if (isError) return <div className="p-8 text-red-500">Failed to load history.</div>

  const batches = data?.data || []

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div>
        <Link to="/import" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-4">
          <ArrowLeft size={16} className="mr-1.5" /> Back to Import Wizard
        </Link>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Import History</h1>
        <p className="text-gray-500 mt-1">View past employee import batches and download error reports.</p>
      </div>

      <Card className="bg-white shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/60 border-b border-gray-100">
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date & Time</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Import Type</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Total Rows</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Valid</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Errors</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Status / Report</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {batches.map((batch: any) => (
              <tr key={batch.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900 text-sm">
                    {new Date(batch.created_at).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(batch.created_at).toLocaleTimeString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet size={16} className="text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">{batch.import_type}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center font-medium text-gray-900">{batch.total_rows}</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center justify-center min-w-[2rem] px-1.5 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700">
                    {batch.valid_rows}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center justify-center min-w-[2rem] px-1.5 py-0.5 rounded text-xs font-bold ${batch.error_rows > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                    {batch.error_rows}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {batch.status === 'COMPLETED' ? (
                    <div className="flex items-center justify-end gap-3">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 uppercase tracking-wide">
                        <CheckCircle2 size={14} /> Completed
                      </span>
                      {batch.error_rows > 0 && (
                        <button className="text-gray-400 hover:text-blue-600 transition-colors" title="Download Error Report">
                          <Download size={18} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="flex items-center justify-end gap-1.5 text-xs font-bold text-yellow-600 uppercase tracking-wide">
                      <AlertCircle size={14} /> {batch.status}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {batches.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            No previous imports found.
          </div>
        )}
      </Card>
    </div>
  )
}
