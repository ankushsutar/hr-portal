import { X } from 'lucide-react'
import { Card } from '../../components/ui/Card'

export const LeaveApplicationForm = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-mono">
      <Card className="w-full max-w-lg bg-[#111827] border-slate-800 p-0 overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center px-5 py-3.5 border-b border-slate-800 bg-slate-900/60">
          <h3 className="text-sm font-semibold text-slate-100">Apply for Leave</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <form className="p-5 space-y-4 text-xs" onSubmit={(e) => { e.preventDefault(); onClose(); }}>
          <div>
            <label className="block text-slate-400 mb-1">Leave Type Category</label>
            <select className="w-full px-3 py-1.5 bg-[#0B0F19] border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-blue-500">
              <option>Annual Privilege Leave (PL)</option>
              <option>Casual Leave (CL)</option>
              <option>Sick Leave (SL)</option>
              <option>Unpaid Leave of Absence (LWP)</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Start Date</label>
              <input type="date" className="w-full px-3 py-1.5 bg-[#0B0F19] border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-blue-500" required />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">End Date</label>
              <input type="date" className="w-full px-3 py-1.5 bg-[#0B0F19] border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-blue-500" required />
            </div>
          </div>
          
          <div>
            <label className="block text-slate-400 mb-1">Reason & Coverage Details</label>
            <textarea 
              rows={3} 
              placeholder="Provide context for manager review..."
              className="w-full px-3 py-1.5 bg-[#0B0F19] border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
            ></textarea>
          </div>
          
          <div className="pt-3 flex gap-3 justify-end border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-3 py-1.5 bg-[#0B0F19] hover:bg-slate-800 border border-slate-800 text-slate-300 rounded font-semibold">
              Cancel
            </button>
            <button type="submit" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold transition-colors">
              Submit Leave Request
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}
