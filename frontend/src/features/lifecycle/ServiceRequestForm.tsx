import React from 'react'
import { X } from 'lucide-react'
import { Card } from '../../components/ui/Card'

export const ServiceRequestForm = ({ type, onClose }: { type: string, onClose: () => void }) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    let endpoint = ''
    if (type === 'ADVANCE') endpoint = 'advances'
    else if (type === 'WFH' || type === 'OD') endpoint = 'special-attendance'
    else if (type === 'RESIGN') endpoint = 'terminations'
    else { onClose(); return; }

    try {
      const token = localStorage.getItem('hrms_token') || localStorage.getItem('token')
      const res = await fetch(`/api/v1/lifecycle/${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          request_type: type,
          reason: 'Generated from UI'
        })
      })
      if (res.ok) {
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
              <label className="block text-[var(--text-muted)] mb-1">Amount Requested (₹)</label>
              <input type="number" className="w-full px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded text-[var(--text-main)] focus:outline-none focus:border-[var(--color-primary)]" required placeholder="e.g. 25000" />
            </div>
            <div>
              <label className="block text-[var(--text-muted)] mb-1">Recovery Duration (Months)</label>
              <select className="w-full px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded text-[var(--text-main)] focus:outline-none focus:border-[var(--color-primary)]">
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[var(--text-muted)] mb-1">Start Date</label>
              <input type="date" className="w-full px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded text-[var(--text-main)] focus:outline-none focus:border-[var(--color-primary)]" required />
            </div>
            <div>
              <label className="block text-[var(--text-muted)] mb-1">End Date</label>
              <input type="date" className="w-full px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded text-[var(--text-main)] focus:outline-none focus:border-[var(--color-primary)]" required />
            </div>
          </div>
        )
      case 'RESIGN':
        return (
          <div>
            <label className="block text-[var(--text-muted)] mb-1">Proposed Last Working Day</label>
            <input type="date" className="w-full px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded text-[var(--text-main)] focus:outline-none focus:border-[var(--color-primary)]" required />
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Note: Standard contractual notice period policy applies.</p>
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-mono">
      <Card className="w-full max-w-md bg-[var(--bg-card)] border-[var(--border-color)] p-0 overflow-hidden shadow-2xl text-[var(--text-main)]">
        <div className="flex justify-between items-center px-5 py-3.5 border-b border-[var(--border-color)] bg-[var(--bg-subtle)]">
          <h3 className="text-sm font-semibold text-[var(--text-main)]">{getTitle()}</h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <form className="p-5 space-y-4 text-xs" onSubmit={handleSubmit}>
          {renderFields()}
          
          <div>
            <label className="block text-[var(--text-muted)] mb-1">Reason / Notes</label>
            <textarea 
              rows={3} 
              className="w-full px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded text-[var(--text-main)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
              required
              placeholder="Provide detailed context..."
            ></textarea>
          </div>
          
          <div className="pt-3 flex gap-3 justify-end border-t border-[var(--border-color)]">
            <button type="button" onClick={onClose} className="px-3 py-1.5 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] rounded">
              Cancel
            </button>
            <button type="submit" className={`px-3 py-1.5 text-white rounded font-semibold transition-colors shadow-sm ${type === 'RESIGN' ? 'bg-rose-600 hover:bg-rose-500' : 'theme-accent-bg hover:opacity-90'}`}>
              Submit Request
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}
