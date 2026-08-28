import { X } from 'lucide-react'

export const ServiceRequestForm = ({ type, onClose }: { type: string, onClose: () => void }) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    let endpoint = ''
    if (type === 'ADVANCE') endpoint = 'advances'
    else if (type === 'WFH' || type === 'OD') endpoint = 'special-attendance'
    else if (type === 'RESIGN') endpoint = 'terminations'
    else { onClose(); return; }

    try {
      const res = await fetch(`http://localhost:8080/api/v1/lifecycle/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Mocking payloads for different types just for UI completion
          request_type: type,
          reason: 'Generated from UI'
        })
      })
      if (res.ok) {
        alert("Request submitted successfully.")
        onClose()
      }
    } catch(err) {
      console.error(err)
    }
  }

  const renderFields = () => {
    switch (type) {
      case 'ADVANCE':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount Requested (₹)</label>
              <input type="number" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recovery Duration (Months)</label>
              <select className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
                <option value="1">1 Month</option>
                <option value="2">2 Months</option>
                <option value="3">3 Months</option>
              </select>
            </div>
          </>
        )
      case 'WFH':
      case 'OD':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" required />
            </div>
          </div>
        )
      case 'RESIGN':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Last Working Day</label>
            <input type="date" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" required />
            <p className="text-xs text-gray-500 mt-1">Please refer to your contract for the required notice period.</p>
          </div>
        )
      default:
        return null
    }
  }

  const getTitle = () => {
    switch(type) {
      case 'ADVANCE': return 'Request Salary Advance'
      case 'WFH': return 'Request Work From Home'
      case 'OD': return 'Request On Duty (OD)'
      case 'RESIGN': return 'Initiate Separation'
      default: return 'Service Request'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">{getTitle()}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form className="p-6 space-y-5" onSubmit={handleSubmit}>
          {renderFields()}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Notes</label>
            <textarea 
              rows={3} 
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
              required
            ></textarea>
          </div>
          
          <div className="pt-4 flex gap-3 justify-end border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors shadow-sm ${type === 'RESIGN' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
