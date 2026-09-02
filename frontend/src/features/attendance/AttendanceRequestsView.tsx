import React, { useState } from 'react'
import { Plus, Check, X, Search } from 'lucide-react'

interface RequestItem {
  id: string
  employee_code: string
  employee_name: string
  date: string
  check_in: string
  check_out: string
  shift: string
  at_work: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reason: string
}

export const AttendanceRequestsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'REQUESTED' | 'ALL'>('REQUESTED')
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Form State
  const [reqEmp, setReqEmp] = useState('PEP00 - Adam Admin')
  const [reqDate, setReqDate] = useState('2026-09-02')
  const [reqIn, setReqIn] = useState('09:00')
  const [reqOut, setReqOut] = useState('18:00')
  const [reqShift, setReqShift] = useState('Regular Shift')
  const [reqReason, setReqReason] = useState('')

  const [requests, setRequests] = useState<RequestItem[]>([
    { id: '1', employee_code: 'PEP00', employee_name: 'Adam Admin', date: '2026-09-01', check_in: '09:13 AM', check_out: '06:36 PM', shift: 'Regular Shift', at_work: '09:23', status: 'PENDING', reason: 'Forgot RFID card swipe' },
    { id: '2', employee_code: 'PEP10', employee_name: 'David King', date: '2026-09-01', check_in: '09:18 AM', check_out: '06:13 PM', shift: 'Regular Shift', at_work: '08:55', status: 'PENDING', reason: 'Biometric terminal offline' },
    { id: '3', employee_code: 'PEP03', employee_name: 'Emily Clark', date: '2026-09-01', check_in: '09:12 AM', check_out: '06:55 PM', shift: 'Regular Shift', at_work: '09:43', status: 'APPROVED', reason: 'Client site deployment' },
    { id: '4', employee_code: 'PEP11', employee_name: 'Emma Lee', date: '2026-09-01', check_in: '09:21 AM', check_out: '06:16 PM', shift: 'Regular Shift', at_work: '08:55', status: 'REJECTED', reason: 'No manager approval' },
  ])

  const handleAction = (id: string, action: 'APPROVE' | 'REJECT') => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' } : r))
    )
    setToastMsg(`Request ${action === 'APPROVE' ? 'Approved' : 'Rejected'} Successfully!`)
    setTimeout(() => setToastMsg(null), 3000)
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newItem: RequestItem = {
      id: Date.now().toString(),
      employee_code: reqEmp.split(' - ')[0],
      employee_name: reqEmp.split(' - ')[1] || 'Employee',
      date: reqDate,
      check_in: reqIn,
      check_out: reqOut,
      shift: reqShift,
      at_work: '09:00',
      status: 'PENDING',
      reason: reqReason || 'Attendance Regularization Request',
    }
    setRequests([newItem, ...requests])
    setIsModalOpen(false)
    setReqReason('')
    setToastMsg('Regularization Request Submitted!')
    setTimeout(() => setToastMsg(null), 3000)
  }

  const filteredRequests = requests.filter((r) => {
    if (activeTab === 'REQUESTED' && r.status !== 'PENDING') return false
    return (
      r.employee_name.toLowerCase().includes(search.toLowerCase()) ||
      r.employee_code.toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2 z-50 animate-bounce">
          <Check className="w-4 h-4" />
          <span className="text-xs font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('REQUESTED')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'REQUESTED'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
            }`}
          >
            Requested Attendances ({requests.filter((r) => r.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'ALL'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
            }`}
          >
            All Attendances ({requests.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee..."
              className="bg-slate-900 border border-slate-800 text-xs text-slate-200 pl-8 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-rose-500/50 w-48"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs font-medium px-4 py-2 rounded-xl shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Request</span>
          </button>
        </div>
      </div>

      {/* Requests Data Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-4">Employee</th>
                <th className="p-4">Date</th>
                <th className="p-4">Check-In</th>
                <th className="p-4">Check-Out</th>
                <th className="p-4">Shift</th>
                <th className="p-4">At Work</th>
                <th className="p-4">Reason</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredRequests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 font-medium text-white flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold text-[10px]">
                      {r.employee_code}
                    </div>
                    <span>{r.employee_name}</span>
                  </td>
                  <td className="p-4 font-mono text-slate-400">{r.date}</td>
                  <td className="p-4 font-mono text-emerald-400">{r.check_in}</td>
                  <td className="p-4 font-mono text-amber-400">{r.check_out}</td>
                  <td className="p-4 text-slate-300">{r.shift}</td>
                  <td className="p-4 font-mono text-blue-400">{r.at_work} hrs</td>
                  <td className="p-4 text-slate-400 max-w-xs truncate">{r.reason}</td>
                  <td className="p-4">
                    {r.status === 'PENDING' && (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-300">
                        Requested
                      </span>
                    )}
                    {r.status === 'APPROVED' && (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                        Approved
                      </span>
                    )}
                    {r.status === 'REJECTED' && (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-300">
                        Rejected
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {r.status === 'PENDING' && (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleAction(r.id, 'APPROVE')}
                          className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-colors"
                          title="Approve Request"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleAction(r.id, 'REJECT')}
                          className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors"
                          title="Reject Request"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Popup for Create Request */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-white">Create Attendance Request</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Employee</label>
                <select
                  value={reqEmp}
                  onChange={(e) => setReqEmp(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option>PEP00 - Adam Admin</option>
                  <option>PEP10 - David King</option>
                  <option>PEP03 - Emily Clark</option>
                  <option>PEP11 - Emma Lee</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={reqDate}
                    onChange={(e) => setReqDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Shift</label>
                  <select
                    value={reqShift}
                    onChange={(e) => setReqShift(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option>Regular Shift</option>
                    <option>Morning Shift</option>
                    <option>Night Shift</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Check-In Time</label>
                  <input
                    type="time"
                    value={reqIn}
                    onChange={(e) => setReqIn(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Check-Out Time</label>
                  <input
                    type="time"
                    value={reqOut}
                    onChange={(e) => setReqOut(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Reason / Justification</label>
                <textarea
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  rows={3}
                  placeholder="Enter reason for regularization..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-medium bg-rose-500 hover:bg-rose-600 text-white shadow-lg"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
