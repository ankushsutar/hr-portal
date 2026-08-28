import { useQuery } from '@tanstack/react-query'
import { Card } from '../../components/ui/Card'
import { CheckCircle2, AlertCircle, MapPin } from 'lucide-react'

export const MyAttendance = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: async () => {
      // Reusing the daily status endpoint with a specific employee filter conceptually
      const res = await fetch(`/api/v1/attendance/daily`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to fetch attendance')
      return res.json()
    }
  })

  if (isLoading) return <div className="p-8 text-gray-500">Loading my attendance...</div>
  // Just grab the first record from the mock data to simulate "my" attendance
  const myLogs = [data?.data[0]]

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-[30px] font-bold text-gray-900 leading-[36px] tracking-tight">My Attendance</h1>
        <p className="text-sm text-gray-500 mt-1">View your daily punch logs and attendance status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 bg-blue-50/50 border border-blue-100">
          <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">Present Days (Aug)</p>
          <h2 className="text-3xl font-bold text-gray-900 mt-2">18</h2>
        </Card>
        <Card className="p-6 bg-orange-50/50 border border-orange-100">
          <p className="text-sm font-medium text-orange-600 uppercase tracking-wide">Late Marks</p>
          <h2 className="text-3xl font-bold text-gray-900 mt-2">2</h2>
        </Card>
        <Card className="p-6 bg-gray-50/50 border border-gray-100">
          <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Average Work Hours</p>
          <h2 className="text-3xl font-bold text-gray-900 mt-2">8h 45m</h2>
        </Card>
      </div>

      <Card className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-semibold text-gray-900">Recent Punches</h3>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/20">
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">First In</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Out</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location/IP</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {myLogs.filter(Boolean).map((log: any, idx: number) => (
              <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-sm text-gray-900">{log.date}</td>
                <td className="px-6 py-4 font-mono text-sm text-gray-700">{log.first_in}</td>
                <td className="px-6 py-4 font-mono text-sm text-gray-700">{log.last_out}</td>
                <td className="px-6 py-4 font-mono text-sm text-gray-700">9h 05m</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <MapPin size={14} /> HQ Office (Biometric)
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
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
    </div>
  )
}
