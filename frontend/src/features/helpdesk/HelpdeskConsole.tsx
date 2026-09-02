import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '../../components/ui/Card'
import { LifeBuoy, Plus, AlertOctagon, CheckCircle2, Clock, MessageSquare, User, Filter, ShieldCheck, Tag, ChevronRight, Send, AlertTriangle } from 'lucide-react'

interface HelpdeskCategory {
  id: string
  name: string
  description: string
  sla_hours: number
}

interface HelpdeskTicket {
  id: string
  ticket_number: string
  employee_id: string
  employee_code?: string
  employee_name?: string
  category_id: string
  category_name?: string
  subject: string
  description: string
  priority: string
  status: string
  assigned_to?: string
  assigned_to_name?: string
  sla_hours: number
  is_sla_breached: bool
  resolved_at?: string
  resolution_notes?: string
  created_at: string
  comments_count: number
}

interface TicketComment {
  id: string
  ticket_id: string
  user_id: string
  user_name?: string
  user_role?: string
  comment: string
  created_at: string
}

export const HelpdeskConsole = () => {
  const qc = useQueryClient()
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)

  // Submit Ticket Form
  const [ticketCategory, setTicketCategory] = useState('')
  const [ticketPriority, setTicketPriority] = useState('MEDIUM')
  const [ticketSubject, setTicketSubject] = useState('')
  const [ticketDescription, setTicketDescription] = useState('')

  // New Comment Form
  const [newComment, setNewComment] = useState('')
  const [resolutionNotes, setResolutionNotes] = useState('')

  // Fetch Categories
  const { data: catRes } = useQuery({
    queryKey: ['helpdesk-categories'],
    queryFn: async () => {
      const res = await fetch('/api/v1/helpdesk/categories', {
        headers: { Authorization: `Bearer ${localStorage.getItem('hrms_token') || localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to load categories')
      return res.json()
    }
  })

  // Fetch Tickets
  const { data: tktRes, isLoading } = useQuery({
    queryKey: ['helpdesk-tickets'],
    queryFn: async () => {
      const res = await fetch('/api/v1/helpdesk/tickets', {
        headers: { Authorization: `Bearer ${localStorage.getItem('hrms_token') || localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to load tickets')
      return res.json()
    }
  })

  // Fetch Ticket Details & Comments
  const { data: ticketDetailRes, isPending: isDetailLoading } = useQuery({
    queryKey: ['helpdesk-ticket-detail', selectedTicketId],
    queryFn: async () => {
      if (!selectedTicketId) return null
      const res = await fetch(`/api/v1/helpdesk/tickets/${selectedTicketId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('hrms_token') || localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to load ticket details')
      return res.json()
    },
    enabled: !!selectedTicketId
  })

  // Submit Ticket Mutation
  const submitMut = useMutation({
    mutationFn: async (payload: { category_id: string; priority: string; subject: string; description: string }) => {
      const res = await fetch('/api/v1/helpdesk/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('hrms_token') || localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error || 'Failed to submit ticket')
      return data
    },
    onSuccess: (data) => {
      setSuccessMsg(data.message)
      setIsSubmitModalOpen(false)
      setTicketSubject('')
      setTicketDescription('')
      qc.invalidateQueries({ queryKey: ['helpdesk-tickets'] })
    },
    onError: (err: any) => setErrorMsg(err.message)
  })

  // Add Comment Mutation
  const commentMut = useMutation({
    mutationFn: async ({ ticket_id, comment }: { ticket_id: string; comment: string }) => {
      const res = await fetch(`/api/v1/helpdesk/tickets/${ticket_id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('hrms_token') || localStorage.getItem('token')}`
        },
        body: JSON.stringify({ comment })
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error || 'Failed to post comment')
      return data
    },
    onSuccess: () => {
      setNewComment('')
      qc.invalidateQueries({ queryKey: ['helpdesk-ticket-detail', selectedTicketId] })
      qc.invalidateQueries({ queryKey: ['helpdesk-tickets'] })
    },
    onError: (err: any) => setErrorMsg(err.message)
  })

  // Transition Ticket Status Mutation
  const transitionMut = useMutation({
    mutationFn: async ({ ticket_id, action, resolution_notes }: { ticket_id: string; action: string; resolution_notes?: string }) => {
      const res = await fetch(`/api/v1/helpdesk/tickets/${ticket_id}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('hrms_token') || localStorage.getItem('token')}`
        },
        body: JSON.stringify({ action, resolution_notes })
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error || 'Failed to update ticket status')
      return data
    },
    onSuccess: (data) => {
      setSuccessMsg(data.message)
      qc.invalidateQueries({ queryKey: ['helpdesk-ticket-detail', selectedTicketId] })
      qc.invalidateQueries({ queryKey: ['helpdesk-tickets'] })
    },
    onError: (err: any) => setErrorMsg(err.message)
  })

  const categories: HelpdeskCategory[] = catRes?.data || []
  const tickets: HelpdeskTicket[] = tktRes?.data || []

  const activeTickets = tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS')
  const breachedTickets = tickets.filter(t => t.is_sla_breached)
  const resolvedTickets = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED')

  const selectedTicket: HelpdeskTicket | null = ticketDetailRes?.ticket || null
  const comments: TicketComment[] = ticketDetailRes?.comments || []

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded text-xs font-mono flex items-center justify-between">
          <span className="flex items-center gap-1.5"><CheckCircle2 size={14} /> {successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="font-bold">×</button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded text-xs font-mono flex items-center justify-between">
          <span className="flex items-center gap-1.5"><AlertTriangle size={14} /> {errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="font-bold">×</button>
        </div>
      )}

      {/* Header Banner */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <LifeBuoy size={18} className="text-blue-400" />
              ESS Helpdesk & HR Case Management Console
            </h3>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Submit employee support requests, track SLA resolution deadlines, and manage multi-stage HR inquiry cases.
            </p>
          </div>
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus size={14} /> New Support Ticket
          </button>
        </div>
      </Card>

      {/* SLA & Metrics Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
        <Card className="p-4 space-y-1">
          <span className="text-slate-400 uppercase tracking-wider text-[10px]">Total Support Tickets</span>
          <div className="text-2xl font-bold text-slate-100">{tickets.length}</div>
          <span className="text-slate-500 text-[11px]">ALL TIME CASES</span>
        </Card>
        <Card className="p-4 space-y-1 border-l-2 border-l-blue-500">
          <span className="text-slate-400 uppercase tracking-wider text-[10px]">Active Open Cases</span>
          <div className="text-2xl font-bold text-blue-400">{activeTickets.length}</div>
          <span className="text-blue-400 text-[11px]">IN QUEUE OR WORK IN PROGRESS</span>
        </Card>
        <Card className="p-4 space-y-1 border-l-2 border-l-rose-500">
          <span className="text-slate-400 uppercase tracking-wider text-[10px]">SLA Breached Cases</span>
          <div className="text-2xl font-bold text-rose-400 flex items-center gap-1.5">
            {breachedTickets.length}
            {breachedTickets.length > 0 && <AlertOctagon size={16} className="animate-pulse text-rose-400" />}
          </div>
          <span className="text-rose-400 text-[11px]">EXCEEDED TARGET HOURS</span>
        </Card>
        <Card className="p-4 space-y-1 border-l-2 border-l-emerald-500">
          <span className="text-slate-400 uppercase tracking-wider text-[10px]">Resolved Cases</span>
          <div className="text-2xl font-bold text-emerald-400">{resolvedTickets.length}</div>
          <span className="text-emerald-400 text-[11px]">SUCCESSFULLY CLOSED</span>
        </Card>
      </div>

      {/* Tickets Queue Table */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Tag size={16} className="text-blue-400" />
            Support Case Queue ({tickets.length})
          </h4>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-slate-500 font-mono text-xs">Loading support tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="py-8 text-center text-slate-500 font-mono text-xs">No helpdesk tickets created yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Ticket ID</th>
                  <th className="pb-3 font-semibold">Employee</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Subject</th>
                  <th className="pb-3 font-semibold">Priority</th>
                  <th className="pb-3 font-semibold">SLA Target</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {tickets.map(t => (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-bold text-blue-400">{t.ticket_number}</td>
                    <td className="py-3 font-semibold text-slate-200">
                      {t.employee_name || 'Employee'} <span className="text-slate-500 text-[11px]">({t.employee_code || 'EMP'})</span>
                    </td>
                    <td className="py-3 text-slate-400">{t.category_name}</td>
                    <td className="py-3 text-slate-200 max-w-xs truncate">{t.subject}</td>
                    <td className="py-3">
                      {t.priority === 'URGENT' || t.priority === 'HIGH' ? (
                        <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                          {t.priority}
                        </span>
                      ) : (
                        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                          {t.priority}
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      {t.is_sla_breached ? (
                        <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit">
                          <AlertOctagon size={11} /> BREACHED ({t.sla_hours}h)
                        </span>
                      ) : (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit">
                          <Clock size={11} /> OK ({t.sla_hours}h SLA)
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      {t.status === 'RESOLVED' || t.status === 'CLOSED' ? (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                          {t.status}
                        </span>
                      ) : t.status === 'IN_PROGRESS' ? (
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                          IN PROGRESS
                        </span>
                      ) : (
                        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                          OPEN
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setSelectedTicketId(t.id)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded text-[11px] font-medium flex items-center gap-1 ml-auto transition-colors"
                      >
                        Details ({t.comments_count}) <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Ticket Details & Discussion Drawer Modal */}
      {selectedTicketId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-end p-0">
          <div className="bg-[#111827] border-l border-slate-800 w-full max-w-xl h-full p-6 space-y-6 overflow-y-auto animate-slide-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-blue-400">{selectedTicket?.ticket_number}</span>
                <h3 className="text-base font-bold text-slate-100 mt-0.5">{selectedTicket?.subject}</h3>
              </div>
              <button onClick={() => setSelectedTicketId(null)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>

            {isDetailLoading || !selectedTicket ? (
              <div className="py-12 text-center text-slate-500 font-mono text-xs">Loading case details...</div>
            ) : (
              <div className="space-y-6 text-xs font-mono">
                {/* Meta Matrix */}
                <div className="bg-[#0B0F19] p-4 rounded-lg border border-slate-800 grid grid-cols-2 gap-3 text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Employee</span>
                    <span className="font-semibold text-slate-200">{selectedTicket.employee_name} ({selectedTicket.employee_code})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Category</span>
                    <span className="font-semibold text-slate-200">{selectedTicket.category_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Status</span>
                    <span className="font-bold text-blue-400">{selectedTicket.status}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">SLA Status</span>
                    {selectedTicket.is_sla_breached ? (
                      <span className="font-bold text-rose-400">BREACHED</span>
                    ) : (
                      <span className="font-bold text-emerald-400">ON TRACK ({selectedTicket.sla_hours}h)</span>
                    )}
                  </div>
                </div>

                {/* Description Box */}
                <div className="space-y-2">
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[11px]">Issue Description</span>
                  <div className="bg-[#0B0F19] p-3.5 rounded border border-slate-800 text-slate-200 whitespace-pre-wrap">
                    {selectedTicket.description}
                  </div>
                </div>

                {/* Workflow Status Controls */}
                <div className="bg-[#0B0F19] p-4 rounded-lg border border-slate-800 space-y-3">
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[11px]">HR Action Controls</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedTicket.status === 'OPEN' && (
                      <button
                        onClick={() => transitionMut.mutate({ ticket_id: selectedTicket.id, action: 'START_PROGRESS' })}
                        className="bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded font-medium transition-colors"
                      >
                        Start Investigation
                      </button>
                    )}
                    {selectedTicket.status !== 'RESOLVED' && selectedTicket.status !== 'CLOSED' && (
                      <button
                        onClick={() => transitionMut.mutate({
                          ticket_id: selectedTicket.id,
                          action: 'RESOLVE',
                          resolution_notes: resolutionNotes || 'Issue resolved by HR support team.'
                        })}
                        className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded font-medium transition-colors"
                      >
                        Resolve Case
                      </button>
                    )}
                  </div>
                </div>

                {/* Comment Thread */}
                <div className="space-y-3 pt-2">
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-blue-400" />
                    Discussion & Activity Thread ({comments.length})
                  </span>

                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {comments.length === 0 ? (
                      <div className="text-slate-500 italic py-2">No comments posted yet.</div>
                    ) : (
                      comments.map(c => (
                        <div key={c.id} className="bg-[#0B0F19] p-3 rounded border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span className="font-bold text-slate-200">{c.user_name} ({c.user_role})</span>
                            <span>{c.created_at}</span>
                          </div>
                          <p className="text-slate-300">{c.comment}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Comment Input */}
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="Type a comment or update..."
                      className="w-full bg-[#0B0F19] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none"
                    />
                    <button
                      onClick={() => commentMut.mutate({ ticket_id: selectedTicket.id, comment: newComment })}
                      disabled={!newComment || commentMut.isPending}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit Ticket Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-lg w-full max-w-lg p-6 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <LifeBuoy size={16} className="text-blue-400" />
                Submit Support Ticket
              </h3>
              <button onClick={() => setIsSubmitModalOpen(false)} className="text-slate-400 hover:text-white font-bold">×</button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Support Category</label>
                <select
                  value={ticketCategory}
                  onChange={e => setTicketCategory(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none"
                >
                  <option value="">-- Select Category --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.sla_hours}h SLA)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Priority</label>
                <select
                  value={ticketPriority}
                  onChange={e => setTicketPriority(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Subject</label>
                <input
                  type="text"
                  value={ticketSubject}
                  onChange={e => setTicketSubject(e.target.value)}
                  placeholder="e.g. Discrepancy in August payslip tax deduction"
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Detailed Description</label>
                <textarea
                  rows={4}
                  value={ticketDescription}
                  onChange={e => setTicketDescription(e.target.value)}
                  placeholder="Describe your query or issue in detail..."
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setIsSubmitModalOpen(false)} className="px-3 py-1.5 rounded text-xs font-mono text-slate-400">Cancel</button>
              <button
                onClick={() => submitMut.mutate({
                  category_id: ticketCategory,
                  priority: ticketPriority,
                  subject: ticketSubject,
                  description: ticketDescription
                })}
                disabled={!ticketCategory || !ticketSubject || !ticketDescription || submitMut.isPending}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded text-xs font-mono font-medium transition-colors disabled:opacity-50"
              >
                Submit Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
