import { useQuery } from '@tanstack/react-query'
import { Clock, History, Fingerprint, CalendarCheck } from 'lucide-react'
import { useState } from 'react'
import { RegularizationForm } from './RegularizationForm'

const fetchLogs = async () => {
  const res = await fetch('http://localhost:8080/api/v1/attendance/logs')
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export const AttendanceDashboard = () => {
  const [isRegOpen, setIsRegOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<any>(null)
  const [checkedIn, setCheckedIn] = useState(false)
  const { data: logsData, isLoading: logsLoading } = useQuery({ queryKey: ['attendanceLogs'], queryFn: fetchLogs })

  const handleCheckInOut = () => {
    // Mock web clock toggle
    setCheckedIn(!checkedIn)
  }

  const openRegularization = (log: any) => {
    setSelectedLog(log)
    setIsRegOpen(true)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center border-b border-gray-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Attendance</h2>
          <p className="text-gray-500 mt-1">Track your daily work hours and shifts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Web Clock Widget */}
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
            <Fingerprint className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Web Clock</h3>
          <p className="text-sm text-gray-500 mb-6 mt-1">
            {checkedIn ? "You are currently checked in." : "You have not checked in today."}
          </p>
          <div className="text-3xl font-mono text-gray-800 mb-6">
            {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
          <button 
            onClick={handleCheckInOut}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-colors shadow-sm ${
              checkedIn ? 'bg-orange-500 hover:bg-orange-600' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {checkedIn ? 'Check Out' : 'Check In'}
          </button>
        </div>

        {/* Current Month Summary */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-3 text-gray-600 font-medium mb-3">
              <CalendarCheck className="w-5 h-5 text-green-500" /> Days Present
            </div>
            <div className="text-4xl font-bold text-gray-900">18</div>
            <p className="text-xs text-gray-500 mt-2">August 2026</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-3 text-gray-600 font-medium mb-3">
              <Clock className="w-5 h-5 text-red-500" /> Late / Half Days
            </div>
            <div className="text-4xl font-bold text-gray-900">2</div>
            <p className="text-xs text-gray-500 mt-2">August 2026</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">August Attendance Log</h3>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {logsLoading ? (
            <div className="p-8 text-center text-gray-500">Loading logs...</div>
          ) : logsData?.data?.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No logs found for this month.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Shift</th>
                    <th className="px-6 py-4">Check In</th>
                    <th className="px-6 py-4">Check Out</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logsData?.data?.map((log: any) => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{log.date}</td>
                      <td className="px-6 py-4 text-gray-500">{log.shift_name}</td>
                      <td className="px-6 py-4 font-mono text-xs">{log.check_in_time}</td>
                      <td className="px-6 py-4 font-mono text-xs">{log.check_out_time}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          log.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                          log.status === 'LATE' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => openRegularization(log)}
                          className="text-indigo-600 hover:text-indigo-900 font-medium text-sm flex items-center justify-end gap-1 w-full"
                        >
                          <History className="w-4 h-4" /> Regularize
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isRegOpen && <RegularizationForm log={selectedLog} onClose={() => setIsRegOpen(false)} />}
    </div>
  )
}
