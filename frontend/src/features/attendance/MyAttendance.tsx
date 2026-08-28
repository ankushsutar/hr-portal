import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '../../components/ui/Card'
import { CheckCircle2, AlertCircle, MapPin, Briefcase, Home, CalendarPlus, XCircle } from 'lucide-react'

export const MyAttendance = () => {
  const qc = useQueryClient()
  const [requestModal, setRequestModal] = useState<{type: string, open: boolean}>({ type: '', open: false })
  const [requestData, setRequestData] = useState({ date: '', reason: '' })

  const { data: attendanceData, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: async () => {
      const res = await fetch(`/api/v1/attendance/daily`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to fetch attendance')
      return res.json()
    }
  })

  const { data: requestsData, isLoading: isLoadingRequests } = useQuery({
    queryKey: ['my-attendance-requests'],
    queryFn: async () => {
      const res = await fetch(`/api/v1/attendance/requests/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to fetch requests')
      return res.json()
    }
  })

  const submitRequest = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/attendance/requests', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ type: requestModal.type, ...requestData })
      })
      if (!res.ok) throw new Error('Request failed')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-attendance-requests'] })
      setRequestModal({ type: '', open: false })
      setRequestData({ date: '', reason: '' })
      alert('Request submitted successfully')
    }
  })

  if (isLoadingAttendance || isLoadingRequests) return <div className="p-8 text-gray-500">Loading...</div>
  const myLogs = [attendanceData?.data?.[0]]
  const myRequests = requestsData?.data || []

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-bold text-gray-900 leading-[36px] tracking-tight">My Attendance</h1>
          <p className="text-sm text-gray-500 mt-1">View your daily punch logs and submit OD/WFH requests.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setRequestModal({ type: 'WFH', open: true })}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Home size={16} /> Request WFH
          </button>
          <button 
            onClick={() => setRequestModal({ type: 'OD', open: true })}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Briefcase size={16} /> Request OD
          </button>
          <button 
            onClick={() => setRequestModal({ type: 'COMP_OFF', open: true })}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <CalendarPlus size={16} /> Earn Comp-off
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 bg-white border border-gray-100 shadow-sm">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Present Days (Aug)</p>
          <h2 className="text-3xl font-bold text-gray-900 mt-2">18</h2>
        </Card>
        <Card className="p-6 bg-white border border-gray-100 shadow-sm">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Late Marks</p>
          <h2 className="text-3xl font-bold text-orange-600 mt-2">2</h2>
        </Card>
        <Card className="p-6 bg-white border border-gray-100 shadow-sm">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Available Comp-offs</p>
          <h2 className="text-3xl font-bold text-blue-600 mt-2">1.5</h2>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-semibold text-gray-900">Recent Punches</h3>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/20">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">In/Out</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {myLogs.filter(Boolean).map((log: any, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-sm text-gray-900">{log.date}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="font-mono">{log.first_in} - {log.last_out}</div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1"><MapPin size={12}/> HQ Office</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      log.status === 'PRESENT' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                    }`}>
                      {log.status === 'PRESENT' ? <CheckCircle2 size={12}/> : <AlertCircle size={12}/>}
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-semibold text-gray-900">My Requests</h3>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/20">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {myRequests.map((req: any, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-sm text-gray-900">{req.type}</div>
                    <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[150px]" title={req.reason}>{req.reason}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">{req.date}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                      req.status === 'APPROVED' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                </tr>
              ))}
              {myRequests.length === 0 && (
                <tr><td colSpan={3} className="p-8 text-center text-gray-500">No requests found.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>

      {requestModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-fade-in relative">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                {requestModal.type === 'OD' ? 'Request On Duty (OD)' : 
                 requestModal.type === 'WFH' ? 'Request Work From Home' : 'Earn Comp-off'}
              </h3>
              <button onClick={() => setRequestModal({ type: '', open: false })} className="text-gray-400 hover:text-gray-600">
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input 
                  type="date" 
                  value={requestData.date}
                  onChange={(e) => setRequestData({...requestData, date: e.target.value})}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Justification</label>
                <textarea 
                  value={requestData.reason}
                  onChange={(e) => setRequestData({...requestData, reason: e.target.value})}
                  placeholder="Explain why this request is needed..." 
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none min-h-[100px] resize-none"
                />
              </div>
              <div className="pt-2">
                <button 
                  onClick={() => submitRequest.mutate()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
