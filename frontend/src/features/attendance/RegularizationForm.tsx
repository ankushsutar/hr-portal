import { X } from 'lucide-react'
import { Card } from '../../components/ui/Card'

export const RegularizationForm = ({ log, onClose }: { log: any, onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-mono">
      <Card className="w-full max-w-lg bg-[var(--bg-card)] border-[var(--border-color)] p-0 overflow-hidden shadow-2xl text-[var(--text-main)]">
        <div className="flex justify-between items-center px-5 py-3.5 border-b border-[var(--border-color)] bg-[var(--bg-subtle)]">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-main)]">Regularize Attendance Record</h3>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">REQUEST TIMESTAMP CORRECTION FOR {log?.date}</p>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <form className="p-5 space-y-4 text-xs font-sans" onSubmit={(e) => { e.preventDefault(); onClose(); }}>
          <div className="bg-[var(--color-primary)]/10 p-3 rounded border border-[var(--color-primary)]/20 text-[11px] theme-accent-text font-mono font-semibold">
            <strong>Logged Data:</strong> Check-in: {log?.check_in_time || '--:--'}, Check-out: {log?.check_out_time || '--:--'}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[var(--text-muted)] mb-1 font-mono">Requested Check-In</label>
              <input type="time" defaultValue="09:00" className="w-full px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded text-[var(--text-main)] focus:outline-none focus:border-[var(--color-primary)] font-mono" required />
            </div>
            <div>
              <label className="block text-[var(--text-muted)] mb-1 font-mono">Requested Check-Out</label>
              <input type="time" defaultValue="18:00" className="w-full px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded text-[var(--text-main)] focus:outline-none focus:border-[var(--color-primary)] font-mono" required />
            </div>
          </div>
          
          <div>
            <label className="block text-[var(--text-muted)] mb-1 font-mono">Reason for Adjustment</label>
            <textarea 
              rows={3} 
              placeholder="e.g., Forgot to clock out, biometrics network failure..."
              className="w-full px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded text-[var(--text-main)] focus:outline-none focus:border-[var(--color-primary)] resize-none font-mono placeholder-[var(--text-muted)]"
              required
            ></textarea>
          </div>
          
          <div className="pt-3 flex gap-3 justify-end border-t border-[var(--border-color)]">
            <button type="button" onClick={onClose} className="px-3 py-1.5 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] rounded font-semibold transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-3 py-1.5 theme-accent-bg hover:opacity-90 text-white rounded font-semibold transition-colors shadow-sm">
              Submit Correction Request
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}
