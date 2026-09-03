import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '../../components/ui/Card'
import { Upload, FileDown, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

export const BulkImportWizard = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(1)
  const [batchId, setBatchId] = useState<string | null>(null)
  
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/v1/import/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData
      })
      if (!res.ok) throw new Error('Failed to upload')
      return res.json()
    },
    onSuccess: (data) => {
      setBatchId(data.data.batch_id)
      setStep(2)
    }
  })

  const { data: batchData, isLoading: isLoadingBatch } = useQuery({
    queryKey: ['import-batch', batchId],
    queryFn: async () => {
      if (!batchId) return null
      const res = await fetch(`/api/v1/import/batches/${batchId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to fetch batch details')
      return res.json()
    },
    enabled: !!batchId,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status
      return status === 'VALIDATING' || status === 'PROCESSING' ? 1000 : false
    }
  })

  const processMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/import/batches/${batchId}/process`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to process batch')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-batch', batchId] })
      setStep(3)
    }
  })

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div>
        <h1 className="text-[28px] font-bold text-[var(--text-main)] leading-tight tracking-tight">Bulk Import Wizard</h1>
        <p className="text-xs font-mono text-[var(--text-muted)] mt-1">BATCH INGESTION & DATA VALIDATION ENGINE FOR EMPLOYEES & MASTERS</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between relative max-w-xl mx-auto py-2 font-mono text-xs">
        {[
          { number: 1, title: 'Upload CSV' },
          { number: 2, title: 'Validation' },
          { number: 3, title: 'Import Summary' },
        ].map((s) => (
          <div key={s.number} className="flex items-center gap-2 z-10 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded-full px-4 py-1 shadow-xs">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] transition-colors ${
              step >= s.number ? 'theme-accent-bg text-white' : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)]'
            }`}>
              {s.number}
            </div>
            <span className={`font-semibold ${step >= s.number ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
              {s.title}
            </span>
          </div>
        ))}
      </div>

      <Card className="p-6 bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
        {step === 1 && (
          <div className="space-y-6 animate-fade-in text-center max-w-lg mx-auto">
            <div>
              <h3 className="text-base font-semibold text-[var(--text-main)] mb-1">Upload Data Batch File</h3>
              <p className="text-xs font-mono text-[var(--text-muted)]">Select standard CSV template to format records correctly.</p>
            </div>
            
            <div className="flex justify-center">
              <button 
                onClick={() => {
                  const csvContent = "first_name,last_name,email,department,designation,join_date\nJohn,Doe,john.doe@company.com,Engineering,Software Engineer,2026-09-01\nJane,Smith,jane.smith@company.com,Product,Product Manager,2026-09-02";
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'employee_import_template.csv';
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] border border-[var(--border-color)] rounded text-xs font-mono transition-colors font-medium"
              >
                <FileDown size={14} /> Download Sample CSV Template
              </button>
            </div>

            <div 
              onClick={() => document.getElementById('csv-upload')?.click()}
              className={`border-2 border-dashed border-[var(--border-color)] rounded-xl p-10 text-center hover:border-[var(--color-primary)] transition-colors bg-[var(--bg-subtle)] cursor-pointer ${uploadMutation.isPending ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <input 
                id="csv-upload" 
                type="file" 
                accept=".csv,.tsv" 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    uploadMutation.mutate(e.target.files[0]);
                  }
                }} 
              />
              <div className="w-12 h-12 bg-[var(--bg-card)] theme-accent-text rounded-full flex items-center justify-center mx-auto mb-3 border border-[var(--border-color)]">
                {uploadMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
              </div>
              <p className="font-semibold text-[var(--text-main)] text-xs mb-1">
                {uploadMutation.isPending ? 'Uploading batch file...' : 'Click to upload CSV dataset'}
              </p>
              <p className="text-[11px] font-mono text-[var(--text-muted)]">Supported formats: CSV, TSV (max 10MB)</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in font-mono text-xs">
            {isLoadingBatch || batchData?.data?.status === 'VALIDATING' ? (
              <div className="text-center py-12 space-y-3">
                <Loader2 className="w-8 h-8 theme-accent-text animate-spin mx-auto" />
                <p className="font-semibold text-[var(--text-main)]">Running validation checks...</p>
                <p className="text-[var(--text-muted)] text-[11px]">Verifying email unique constraints, department keys, and date formats.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[var(--bg-subtle)] border border-[var(--border-color)] p-4 rounded text-center">
                    <p className="text-[var(--text-muted)] text-[11px] uppercase">Total Records</p>
                    <p className="text-2xl font-bold text-[var(--text-main)] mt-1">{batchData?.data?.total_rows}</p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded text-center">
                    <p className="text-emerald-500 text-[11px] uppercase font-semibold">Valid Records</p>
                    <p className="text-2xl font-bold text-emerald-500 mt-1">{batchData?.data?.valid_rows}</p>
                  </div>
                  <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded text-center">
                    <p className="text-rose-500 text-[11px] uppercase font-semibold">Validation Errors</p>
                    <p className="text-2xl font-bold text-rose-500 mt-1">{batchData?.data?.error_rows}</p>
                  </div>
                </div>

                <div className="border border-[var(--border-color)] rounded overflow-hidden">
                  <div className="bg-[var(--bg-subtle)] px-4 py-2 border-b border-[var(--border-color)] font-semibold text-[var(--text-main)]">
                    Row Audit Inspection
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-[var(--border-color)]">
                    {batchData?.data?.errors?.map((err: any, idx: number) => (
                      <div key={idx} className="p-3 bg-rose-500/5 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <AlertCircle size={14} className="text-rose-500" />
                          <span className="font-bold text-rose-500">Row {err.row_number}:</span>
                          <span className="text-[var(--text-main)]">{err.error_message}</span>
                        </div>
                      </div>
                    ))}
                    {(!batchData?.data?.errors || batchData.data.errors.length === 0) && (
                      <div className="p-6 text-center text-emerald-500 flex items-center justify-center gap-2 font-semibold">
                        <CheckCircle2 size={16} /> All rows passed validation tests.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in font-mono text-xs text-center py-6">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-main)] mb-1">Batch Ingestion Completed</h3>
              <p className="text-[var(--text-muted)]">All valid employee records have been inserted into the master repository.</p>
            </div>

            <div className="flex justify-center gap-3">
              <button 
                onClick={() => navigate({ to: '/import/history' })}
                className="px-4 py-2 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] border border-[var(--border-color)] rounded font-semibold transition-colors"
              >
                View Batch History
              </button>
              <button 
                onClick={() => navigate({ to: '/employees' })}
                className="px-4 py-2 theme-accent-bg hover:opacity-90 text-white rounded font-semibold transition-all shadow-sm"
              >
                Go to Directory
              </button>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between pt-5 mt-6 border-t border-[var(--border-color)] font-mono text-xs">
          <button
            onClick={() => setStep(prev => Math.max(1, prev - 1))}
            disabled={step === 1 || uploadMutation.isPending || processMutation.isPending}
            className="px-3 py-1.5 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)] border border-[var(--border-color)] rounded disabled:opacity-30 transition-colors font-medium"
          >
            Previous
          </button>
          
          {step === 2 && (
            <button
              onClick={() => processMutation.mutate()}
              disabled={processMutation.isPending || batchData?.data?.valid_rows === 0}
              className="flex items-center gap-1.5 px-4 py-1.5 theme-accent-bg hover:opacity-90 text-white rounded font-semibold disabled:opacity-50 transition-all shadow-sm"
            >
              {processMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Confirm & Process Batch'} <ArrowRight size={14} />
            </button>
          )}
        </div>
      </Card>
    </div>
  )
}
