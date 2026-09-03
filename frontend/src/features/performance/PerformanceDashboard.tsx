import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Tabs from '@radix-ui/react-tabs';
import { Card } from '../../components/ui/Card';
import { apiFetch } from '../../lib/api';
import { 
  Target, 
  Award, 
  TrendingUp, 
  AlertTriangle, 
  Plus, 
  Star,
  X
} from 'lucide-react';

interface Goal {
  id: string;
  employee_id: string;
  employee_name?: string;
  title: string;
  description: string;
  category: string;
  target_value: number;
  current_value: number;
  weightage: number;
  status: string;
}

interface Review {
  id: string;
  cycle_id: string;
  cycle_title?: string;
  employee_id: string;
  employee_name?: string;
  self_rating?: number;
  self_comments?: string;
  manager_rating?: number;
  manager_comments?: string;
  final_score?: number;
  status: string;
}

interface PipPlan {
  id: string;
  employee_id: string;
  employee_name?: string;
  reason: string;
  start_date: string;
  end_date: string;
  status: string;
  remarks: string;
}

export const PerformanceDashboard = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('goals');
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isPipModalOpen, setIsPipModalOpen] = useState(false);

  // Form states
  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    category: 'INDIVIDUAL',
    target_value: 100,
    current_value: 0,
    weightage: 20
  });

  const [reviewForm, setReviewForm] = useState({
    employee_name: 'Aarav Sharma',
    self_rating: 4.5,
    self_comments: '',
    manager_rating: 4.5,
    manager_comments: ''
  });

  const [pipForm, setPipForm] = useState({
    employee_name: '',
    reason: '',
    start_date: '',
    end_date: '',
    remarks: ''
  });

  // Queries
  const { data: goalsData } = useQuery<{ data: Goal[] }>({
    queryKey: ['performance-goals'],
    queryFn: async () => {
      const res = await apiFetch('/api/v1/performance/goals');
      if (!res.ok) throw new Error('Failed to fetch goals');
      return res.json();
    }
  });

  const { data: reviewsData } = useQuery<{ data: Review[] }>({
    queryKey: ['performance-reviews'],
    queryFn: async () => {
      const res = await apiFetch('/api/v1/performance/reviews');
      if (!res.ok) throw new Error('Failed to fetch reviews');
      return res.json();
    }
  });

  const { data: pipsData } = useQuery<{ data: PipPlan[] }>({
    queryKey: ['performance-pips'],
    queryFn: async () => {
      const res = await apiFetch('/api/v1/performance/pip');
      if (!res.ok) throw new Error('Failed to fetch PIP plans');
      return res.json();
    }
  });

  // Mutations
  const createGoalMutation = useMutation({
    mutationFn: async (newGoal: typeof goalForm) => {
      const res = await apiFetch('/api/v1/performance/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGoal)
      });
      if (!res.ok) throw new Error('Failed to create goal');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-goals'] });
      setIsGoalModalOpen(false);
      setGoalForm({ title: '', description: '', category: 'INDIVIDUAL', target_value: 100, current_value: 0, weightage: 20 });
    }
  });

  const createReviewMutation = useMutation({
    mutationFn: async (newReview: typeof reviewForm) => {
      const res = await apiFetch('/api/v1/performance/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReview)
      });
      if (!res.ok) throw new Error('Failed to submit review');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-reviews'] });
      setIsReviewModalOpen(false);
    }
  });

  const createPipMutation = useMutation({
    mutationFn: async (newPip: typeof pipForm) => {
      const res = await apiFetch('/api/v1/performance/pip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPip)
      });
      if (!res.ok) throw new Error('Failed to create PIP plan');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-pips'] });
      setIsPipModalOpen(false);
    }
  });

  const goals = goalsData?.data || [];
  const reviews = reviewsData?.data || [];
  const pips = pipsData?.data || [];

  return (
    <div className="space-y-6 font-sans">
      {/* Console Header & Metric Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[var(--text-main)] font-mono">Performance & Appraisals</h1>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              FY26 ACTIVE CYCLE
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1 font-mono">
            OKRs, KPI Weightages, Self & Manager Evaluations, PIP Management
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsGoalModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 theme-accent-bg hover:opacity-90 text-white rounded text-xs font-semibold transition-all shadow-sm"
          >
            <Plus size={14} /> New Goal / OKR
          </button>
          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] border border-[var(--border-color)] rounded text-xs font-medium transition-colors"
          >
            <Star size={14} className="text-amber-500" /> Submit Appraisal
          </button>
        </div>
      </div>

      {/* High Density Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase">Active Goals</span>
            <Target className="w-4 h-4 theme-accent-text" />
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--text-main)] mt-2">{goals.length}</div>
          <span className="text-[10px] font-mono text-[var(--text-muted)] mt-1 block">Weighted Target: 100%</span>
        </Card>

        <Card className="p-4 bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase">Appraisals Pending</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--text-main)] mt-2">{reviews.length}</div>
          <span className="text-[10px] font-mono text-amber-500 mt-1 block font-semibold">Cycle ends in 14 days</span>
        </Card>

        <Card className="p-4 bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase">Avg Score</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--text-main)] mt-2">4.65 <span className="text-xs text-[var(--text-muted)]">/ 5.0</span></div>
          <span className="text-[10px] font-mono text-emerald-500 mt-1 block font-semibold">+0.3 vs previous cycle</span>
        </Card>

        <Card className="p-4 bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase">Active PIPs</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--text-main)] mt-2">{pips.length}</div>
          <span className="text-[10px] font-mono text-[var(--text-muted)] mt-1 block">Under monitoring</span>
        </Card>
      </div>

      {/* Tabs System */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="flex gap-2 border-b border-[var(--border-color)] pb-2">
          <Tabs.Trigger
            value="goals"
            className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
              activeTab === 'goals'
                ? 'theme-accent-bg text-white font-semibold shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] bg-[var(--bg-subtle)] border border-[var(--border-color)]'
            }`}
          >
            Goals & KPIs
          </Tabs.Trigger>
          <Tabs.Trigger
            value="reviews"
            className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
              activeTab === 'reviews'
                ? 'theme-accent-bg text-white font-semibold shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] bg-[var(--bg-subtle)] border border-[var(--border-color)]'
            }`}
          >
            Appraisal Cycles & Reviews
          </Tabs.Trigger>
          <Tabs.Trigger
            value="pips"
            className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
              activeTab === 'pips'
                ? 'theme-accent-bg text-white font-semibold shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] bg-[var(--bg-subtle)] border border-[var(--border-color)]'
            }`}
          >
            Performance Improvement (PIP)
          </Tabs.Trigger>
        </Tabs.List>

        {/* Goals Tab */}
        <Tabs.Content value="goals" className="mt-4 space-y-4 focus-visible:outline-none">
          <Card className="p-0 overflow-hidden bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
            <div className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-subtle)] flex items-center justify-between">
              <span className="text-xs font-mono text-[var(--text-main)] font-semibold uppercase">Goal Objectives Matrix</span>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">{goals.length} Goals Registered</span>
            </div>

            <div className="divide-y divide-[var(--border-color)]">
              {goals.map((g) => {
                const progressPct = Math.min(100, Math.round((g.current_value / g.target_value) * 100));
                return (
                  <div key={g.id} className="p-4 hover:bg-[var(--bg-subtle)] transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-semibold text-[var(--text-main)]">{g.title}</h4>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-color)]">
                            {g.category}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--color-primary)]/10 theme-accent-text border border-[var(--color-primary)]/20 font-semibold">
                            Weight: {g.weightage}%
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] leading-relaxed">{g.description}</p>
                        {g.employee_name && (
                          <p className="text-[10px] font-mono text-[var(--text-muted)]">Assigned: {g.employee_name}</p>
                        )}
                      </div>

                      <div className="w-full md:w-64 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-[var(--text-muted)]">Progress</span>
                          <span className="text-[var(--text-main)] font-semibold">{g.current_value} / {g.target_value} ({progressPct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden border border-[var(--border-color)]">
                          <div
                            className={`h-full transition-all duration-300 ${
                              progressPct === 100 ? 'bg-emerald-500' : 'theme-accent-bg'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Tabs.Content>

        {/* Appraisal Reviews Tab */}
        <Tabs.Content value="reviews" className="mt-4 space-y-4 focus-visible:outline-none">
          <Card className="p-0 overflow-hidden bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
            <div className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-subtle)] flex items-center justify-between">
              <span className="text-xs font-mono text-[var(--text-main)] font-semibold uppercase">Appraisal Evaluation Records</span>
            </div>

            <div className="divide-y divide-[var(--border-color)]">
              {reviews.map((r) => (
                <div key={r.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text-main)] font-mono">{r.employee_name}</h4>
                      <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">{r.cycle_title}</p>
                    </div>
                    {r.final_score && (
                      <div className="text-right font-mono">
                        <span className="text-[10px] text-[var(--text-muted)] block uppercase">Final Rating</span>
                        <span className="text-sm font-bold text-emerald-500">{r.final_score} / 5.0</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded bg-[var(--bg-subtle)] border border-[var(--border-color)] space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[var(--text-muted)]">Self Evaluation</span>
                        <span className="text-amber-500 font-semibold">★ {r.self_rating || 'N/A'}</span>
                      </div>
                      <p className="text-xs text-[var(--text-main)] italic">"{r.self_comments || 'No comments'}"</p>
                    </div>

                    <div className="p-3 rounded bg-[var(--bg-subtle)] border border-[var(--border-color)] space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[var(--text-muted)]">Manager Evaluation</span>
                        <span className="text-emerald-500 font-semibold">★ {r.manager_rating || 'N/A'}</span>
                      </div>
                      <p className="text-xs text-[var(--text-main)] italic">"{r.manager_comments || 'No comments'}"</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Tabs.Content>

        {/* PIP Tab */}
        <Tabs.Content value="pips" className="mt-4 space-y-4 focus-visible:outline-none">
          <Card className="p-0 overflow-hidden bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
            <div className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-subtle)] flex items-center justify-between">
              <span className="text-xs font-mono text-[var(--text-main)] font-semibold uppercase">Active Improvement Plans</span>
              <button
                onClick={() => setIsPipModalOpen(true)}
                className="text-xs font-mono text-rose-500 hover:text-rose-600 flex items-center gap-1 font-semibold"
              >
                <Plus size={12} /> Issue PIP
              </button>
            </div>

            <div className="divide-y divide-[var(--border-color)]">
              {pips.map((p) => (
                <div key={p.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-rose-500" />
                      <h4 className="text-xs font-bold text-[var(--text-main)] font-mono">{p.employee_name}</h4>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 font-semibold">
                      {p.status}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-main)] font-mono">{p.reason}</p>

                  <div className="flex items-center gap-4 text-[11px] font-mono text-[var(--text-muted)] pt-1">
                    <span>Period: {p.start_date} → {p.end_date}</span>
                    <span>Remarks: {p.remarks}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Tabs.Content>
      </Tabs.Root>

      {/* Modal: New Goal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg w-full max-w-md p-5 space-y-4 text-[var(--text-main)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h3 className="text-xs font-bold font-mono text-[var(--text-main)]">Create New Goal / OKR</h3>
              <button onClick={() => setIsGoalModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createGoalMutation.mutate(goalForm);
              }}
              className="space-y-3 font-mono text-xs"
            >
              <div>
                <label className="block text-[var(--text-muted)] mb-1">Goal Title *</label>
                <input
                  required
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded text-[var(--text-main)] focus-visible:outline-none focus-visible:border-[var(--color-primary)]"
                  placeholder="e.g. Optimize SQL Query Throughput"
                />
              </div>

              <div>
                <label className="block text-[var(--text-muted)] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={goalForm.description}
                  onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded text-[var(--text-main)] focus-visible:outline-none focus-visible:border-[var(--color-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Category</label>
                  <select
                    value={goalForm.category}
                    onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded text-[var(--text-main)] focus-visible:outline-none focus-visible:border-[var(--color-primary)]"
                  >
                    <option value="INDIVIDUAL">INDIVIDUAL</option>
                    <option value="TEAM">TEAM</option>
                    <option value="COMPANY">COMPANY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Weightage (%)</label>
                  <input
                    type="number"
                    value={goalForm.weightage}
                    onChange={(e) => setGoalForm({ ...goalForm, weightage: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded text-[var(--text-main)] focus-visible:outline-none focus-visible:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="px-3 py-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createGoalMutation.isPending}
                  className="px-3 py-1.5 theme-accent-bg hover:opacity-90 text-white rounded font-semibold shadow-sm"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Appraisal Review */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg w-full max-w-md p-5 space-y-4 text-[var(--text-main)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h3 className="text-xs font-bold font-mono text-[var(--text-main)]">Submit Appraisal Review</h3>
              <button onClick={() => setIsReviewModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createReviewMutation.mutate(reviewForm);
              }}
              className="space-y-3 font-mono text-xs"
            >
              <div>
                <label className="block text-[var(--text-muted)] mb-1">Employee Name</label>
                <input
                  value={reviewForm.employee_name}
                  onChange={(e) => setReviewForm({ ...reviewForm, employee_name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded text-[var(--text-main)] focus-visible:outline-none focus-visible:border-[var(--color-primary)]"
                />
              </div>

              <div>
                <label className="block text-[var(--text-muted)] mb-1">Self Rating (1.0 - 5.0)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={reviewForm.self_rating}
                  onChange={(e) => setReviewForm({ ...reviewForm, self_rating: parseFloat(e.target.value) || 1 })}
                  className="w-full px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded text-[var(--text-main)] focus-visible:outline-none focus-visible:border-[var(--color-primary)]"
                />
              </div>

              <div>
                <label className="block text-[var(--text-muted)] mb-1">Self Comments</label>
                <textarea
                  rows={2}
                  value={reviewForm.self_comments}
                  onChange={(e) => setReviewForm({ ...reviewForm, self_comments: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded text-[var(--text-main)] focus-visible:outline-none focus-visible:border-[var(--color-primary)]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-3 py-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createReviewMutation.isPending}
                  className="px-3 py-1.5 theme-accent-bg hover:opacity-90 text-white rounded font-semibold shadow-sm"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create PIP */}
      {isPipModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg w-full max-w-md p-5 space-y-4 text-[var(--text-main)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h3 className="text-xs font-bold font-mono text-rose-500">Issue Performance Improvement Plan (PIP)</h3>
              <button onClick={() => setIsPipModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createPipMutation.mutate(pipForm);
              }}
              className="space-y-3 font-mono text-xs"
            >
              <div>
                <label className="block text-[var(--text-muted)] mb-1">Employee Name *</label>
                <input
                  required
                  value={pipForm.employee_name}
                  onChange={(e) => setPipForm({ ...pipForm, employee_name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded text-[var(--text-main)] focus-visible:outline-none focus-visible:border-rose-500"
                  placeholder="e.g. Vikram Malhotra"
                />
              </div>

              <div>
                <label className="block text-[var(--text-muted)] mb-1">Reason / Underperformance Details *</label>
                <textarea
                  required
                  rows={2}
                  value={pipForm.reason}
                  onChange={(e) => setPipForm({ ...pipForm, reason: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded text-[var(--text-main)] focus-visible:outline-none focus-visible:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={pipForm.start_date}
                    onChange={(e) => setPipForm({ ...pipForm, start_date: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded text-[var(--text-main)] focus-visible:outline-none focus-visible:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-muted)] mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={pipForm.end_date}
                    onChange={(e) => setPipForm({ ...pipForm, end_date: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded text-[var(--text-main)] focus-visible:outline-none focus-visible:border-rose-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setIsPipModalOpen(false)}
                  className="px-3 py-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPipMutation.isPending}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-semibold shadow-sm"
                >
                  Issue PIP Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
