import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Card } from '../../components/ui/Card';

interface LeaveType {
  id: string;
  name: string;
  code: string;
}

export const LeaveApplicationForm = ({ onClose }: { onClose: () => void }) => {
  const queryClient = useQueryClient();

  const [leaveType, setLeaveType] = useState('Privilege Leave (PL)');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const { data: typesData } = useQuery<{ data: LeaveType[] }>({
    queryKey: ['leaveTypes'],
    queryFn: async () => {
      const res = await fetch('/api/v1/leave/types', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch leave types');
      return res.json();
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (payload: { leave_type: string; start_date: string; end_date: string; total_days: number; reason: string }) => {
      const res = await fetch('/api/v1/leave/applications', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to submit leave application');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveApplications'] });
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] });
      onClose();
    }
  });

  // Calculate day difference
  const calculateDays = () => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const totalDays = calculateDays();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate({
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      total_days: totalDays,
      reason
    });
  };

  const leaveTypes = typesData?.data || [
    { id: '1', name: 'Privilege Leave (PL)', code: 'PL' },
    { id: '2', name: 'Casual Leave (CL)', code: 'CL' },
    { id: '3', name: 'Sick Leave (SL)', code: 'SL' },
    { id: '4', name: 'Leave Without Pay (LWP)', code: 'LWP' }
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-mono">
      <Card className="w-full max-w-lg bg-[var(--bg-card)] border-[var(--border-color)] p-0 overflow-hidden shadow-2xl text-[var(--text-main)]">
        <div className="flex justify-between items-center px-5 py-3.5 border-b border-[var(--border-color)] bg-[var(--bg-subtle)]">
          <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">Request Leave Application</h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)]" aria-label="Close modal">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form className="p-5 space-y-4 text-xs" onSubmit={handleSubmit}>
          <div>
            <label className="block text-[var(--text-muted)] mb-1">Leave Category *</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded text-[var(--text-main)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-primary)]"
            >
              {leaveTypes.map((lt) => (
                <option key={lt.id} value={lt.name}>
                  {lt.name} ({lt.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[var(--text-muted)] mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded text-[var(--text-main)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-primary)]"
              />
            </div>
            <div>
              <label className="block text-[var(--text-muted)] mb-1">End Date *</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded text-[var(--text-main)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-primary)]"
              />
            </div>
          </div>

          {startDate && endDate && (
            <div className="p-2.5 rounded bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 theme-accent-text flex items-center justify-between">
              <span>Total Requested Duration:</span>
              <span className="font-bold text-sm">{totalDays} {totalDays === 1 ? 'Day' : 'Days'}</span>
            </div>
          )}

          <div>
            <label className="block text-[var(--text-muted)] mb-1">Reason & Coverage Details *</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide reason for leave and hand-over context..."
              className="w-full px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded text-[var(--text-main)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-primary)] resize-none"
            />
          </div>

          <div className="pt-3 flex gap-3 justify-end border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] rounded font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="px-4 py-1.5 theme-accent-bg hover:opacity-90 text-white rounded font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-primary)] shadow-sm"
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};
