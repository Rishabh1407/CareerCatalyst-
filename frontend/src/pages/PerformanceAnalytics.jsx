import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { interviewService } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  BarChart3,
  TrendingUp,
  Award,
  Layers,
  Sparkles,
  Calendar,
  Clock,
  ArrowRight,
  Eye,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';

const PerformanceAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await interviewService.getSummaryStats();
      setStats(res.data);
    } catch (err) {
      showToast('Failed to load performance analytics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-slate-400 text-sm">
        Loading performance analytics...
      </div>
    );
  }

  const categoryChartData = stats?.category_performance
    ? Object.entries(stats.category_performance).map(([category, score]) => ({
        category,
        score
      }))
    : [];

  const trendData = stats?.score_trend || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Interview Performance Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track your score trajectories, category strengths, and improvement trends over time.
          </p>
        </div>

        <Link
          to="/interview/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition shrink-0"
        >
          <Sparkles className="w-4 h-4" /> Start Mock Interview
        </Link>
      </div>

      {stats?.total_interviews === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <BarChart3 className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">No Analytics Available Yet</h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            Complete your first interactive mock interview to generate performance metrics, score trends, and category breakdowns.
          </p>
          <Link
            to="/interview/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs transition"
          >
            <Sparkles className="w-4 h-4" /> Start First Mock Interview
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Completed Sessions</span>
              <p className="text-2xl font-black text-slate-900 mt-2">{stats.total_interviews}</p>
              <p className="text-xs text-slate-400 mt-1">Full simulations</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Average Score</span>
              <p className="text-2xl font-black text-blue-600 mt-2">{stats.average_score.toFixed(1)}%</p>
              <p className="text-xs text-slate-400 mt-1">Across all sessions</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Best Score</span>
              <p className="text-2xl font-black text-emerald-600 mt-2">{stats.best_score.toFixed(1)}%</p>
              <p className="text-xs text-slate-400 mt-1">Top evaluation result</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Questions Evaluated</span>
              <p className="text-2xl font-black text-indigo-600 mt-2">{stats.total_questions_answered}</p>
              <p className="text-xs text-slate-400 mt-1">Individual answers</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trend Chart */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Score Trajectory</h3>
                </div>
                <span className="text-[11px] text-slate-400">Score % over sessions</span>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      formatter={(val) => [`${val}%`, 'Score']}
                      contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#scoreGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Scores Chart */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Category Breakdown</h3>
                </div>
                <span className="text-[11px] text-slate-400">Avg score by domain</span>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <XAxis dataKey="category" angle={-15} textAnchor="end" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      formatter={(val) => [`${val}%`, 'Average']}
                      contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                      {categoryChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.score >= 80 ? '#10b981' : entry.score >= 65 ? '#6366f1' : '#f59e0b'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Sessions List */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Recent Evaluations</h3>
              <Link to="/interview/history" className="text-xs text-blue-600 font-semibold hover:underline">
                View All History →
              </Link>
            </div>

            <div className="space-y-3">
              {stats.recent_sessions.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-blue-300 transition flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-slate-900">{s.interview_type}</span>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{s.difficulty}</span>
                      <span>•</span>
                      <span>{new Date(s.started_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{s.target_role || 'Candidate'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-lg font-black text-emerald-600">{s.overall_score.toFixed(0)}%</span>
                    <Link
                      to={`/interview/${s.id}/report`}
                      className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition flex items-center gap-1"
                    >
                      Report <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceAnalytics;
