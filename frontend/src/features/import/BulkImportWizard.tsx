import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Card } from '../../components/ui/Card'
import { Upload, FileDown, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react'

export const BulkImportWizard = () => {
  const [step, setStep] = useState(1)
  const [batchId, setBatchId] = useState<string | null>(null)

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/import/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Upload failed')
      return res.json()
    },
    onSuccess: (data) => {
      setBatchId(data.id)
      setStep(2)
    }
  })

  const { data: batchData, isLoading: isLoadingBatch } = useQuery({
    queryKey: ['import-batch', batchId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/import/batches/${batchId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to fetch batch')
      return res.json()
    },
    enabled: !!batchId && step === 2,
    refetchInterval: (query: any) => (query.state?.data?.data?.status === 'VALIDATING' ? 1000 : false)
  })

  const processMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/import/batches/${batchId}/process`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Processing failed')
      return res.json()
    },
    onSuccess: () => {
      setStep(4)
    }
  })

  const totalSteps = 4
  const nextStep = () => {
    if (step === 3) {
      processMutation.mutate()
    } else {
      setStep(s => Math.min(s + 1, totalSteps))
    }
  }
  const prevStep = () => setStep(s => Math.max(s - 1, 1))

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Bulk Employee Import</h1>
        <p className="text-gray-500 mt-1">Import multiple employees, assign roles, and trigger onboarding.</p>
      </div>

      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex flex-col items-center relative z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
              step >= s ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              {s}
            </div>
            <span className={`text-xs mt-2 font-medium ${step >= s ? 'text-black' : 'text-gray-400'}`}>
              {s === 1 ? 'Upload' : s === 2 ? 'Validate' : s === 3 ? 'Options' : 'Import'}
            </span>
          </div>
        ))}
        {/* Progress Line */}
        <div className="absolute left-0 right-0 h-1 bg-gray-100 -z-0 mx-16 transform translate-y-[-12px]">
          <div className="h-full bg-black transition-all duration-300" style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }} />
        </div>
      </div>

      <Card className="p-8 border border-gray-100 shadow-sm bg-white/50 backdrop-blur-xl">
        {step === 1 && (
          <div className="space-y-6 animate-slide-up">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">Upload Data File</h3>
              <p className="text-gray-500 text-sm">Download our template to ensure your data is formatted correctly.</p>
            </div>
            
            <div className="flex justify-center mb-6">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors">
                <FileDown size={18} /> Download CSV Template
              </button>
            </div>

            <div 
              onClick={() => uploadMutation.mutate()}
              className={`border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center hover:border-black/20 transition-colors bg-gray-50/50 cursor-pointer ${uploadMutation.isPending ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-gray-100 mb-4">
                {uploadMutation.isPending ? <Loader2 className="w-8 h-8 text-gray-400 animate-spin" /> : <Upload className="w-8 h-8 text-gray-400" />}
              </div>
              <p className="font-medium text-gray-700 mb-1">
                {uploadMutation.isPending ? 'Uploading...' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-sm text-gray-500">CSV or Excel (max. 10MB)</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-slide-up">
            {isLoadingBatch || batchData?.data?.status === 'VALIDATING' ? (
              <div className="text-center py-12">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
                <h4 className="font-semibold text-lg">Validating File...</h4>
                <p className="text-gray-500 text-sm mt-1">Checking rows for errors and duplicates.</p>
              </div>
            ) : (
              <>
                <div className={`flex items-center gap-4 p-4 rounded-xl border ${batchData?.data?.error_rows > 0 ? 'bg-yellow-50 text-yellow-800 border-yellow-100' : 'bg-green-50 text-green-800 border-green-100'}`}>
                  {batchData?.data?.error_rows > 0 ? <AlertCircle className="w-6 h-6 flex-shrink-0" /> : <CheckCircle2 className="w-6 h-6 flex-shrink-0" />}
                  <div>
                    <h4 className="font-semibold">Validation Completed</h4>
                    <p className="text-sm mt-1">
                      Found {batchData?.data?.valid_rows} valid rows and {batchData?.data?.error_rows} rows with errors.
                    </p>
                  </div>
                </div>

                {batchData?.data?.error_rows > 0 && (
                  <table className="w-full text-left border-collapse mt-4">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="py-3 px-4 font-medium text-gray-500 text-sm">Row</th>
                        <th className="py-3 px-4 font-medium text-gray-500 text-sm">Error Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchData?.rows?.filter((r: any) => r.status === 'ERROR').map((row: any) => (
                        <tr key={row.id} className="border-b border-gray-50">
                          <td className="py-3 px-4 text-sm font-medium">Row {row.row_number}</td>
                          <td className="py-3 px-4 text-sm text-red-600">{row.error_message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-slide-up">
            <h3 className="text-xl font-bold mb-4">Post-Import Options</h3>
            <div className="space-y-4">
              <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                <input type="checkbox" className="mt-1 w-4 h-4 rounded border-gray-300 text-black focus:ring-black" defaultChecked />
                <div>
                  <span className="block font-medium text-gray-900">Create User Accounts</span>
                  <span className="block text-sm text-gray-500">Automatically create a user account for each employee and send welcome emails.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                <input type="checkbox" className="mt-1 w-4 h-4 rounded border-gray-300 text-black focus:ring-black" defaultChecked />
                <div className="flex-1">
                  <span className="block font-medium text-gray-900">Assign Onboarding Template</span>
                  <span className="block text-sm text-gray-500">Automatically trigger onboarding workflows based on department.</span>
                  <select className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    <option>Standard Organization Onboarding</option>
                  </select>
                </div>
              </label>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-12 animate-slide-up">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Import Successful!</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Successfully imported {batchData?.data?.valid_rows} employees, created user accounts, and triggered onboarding workflows.
            </p>
            <Link to="/import/history" className="px-6 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors inline-block">
              View Import History
            </Link>
          </div>
        )}
      </Card>

      {/* Navigation Buttons */}
      {step < totalSteps && (
        <div className="flex justify-between items-center mt-8">
          <button 
            onClick={prevStep}
            disabled={step === 1 || uploadMutation.isPending || processMutation.isPending}
            className={`flex items-center gap-2 px-6 py-2.5 font-medium rounded-lg transition-colors ${
              step === 1 || uploadMutation.isPending || processMutation.isPending ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 shadow-sm'
            }`}
          >
            <ArrowLeft size={18} /> Back
          </button>
          
          <button 
            onClick={nextStep}
            disabled={
              step === 1 || 
              (step === 2 && (isLoadingBatch || batchData?.data?.status === 'VALIDATING')) ||
              processMutation.isPending
            }
            className="flex items-center gap-2 px-6 py-2.5 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50"
          >
            {processMutation.isPending ? 'Processing...' : step === 3 ? 'Start Import' : 'Next Step'} 
            {!processMutation.isPending && <ArrowRight size={18} />}
          </button>
        </div>
      )}
    </div>
  )
}
