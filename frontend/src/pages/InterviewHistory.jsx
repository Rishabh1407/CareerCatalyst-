import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { interviewService } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  History,
  Trash2,
  Calendar,
  Award,
  Layers,
  Sparkles,
  Loader2,
  Clock,
  ArrowRight,
  Eye,
  CheckCircle2,
  Mic,
  MessageSquare
} from 'lucide-react';

const InterviewHistory = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchHistory = async () => {
    try {
      const res = await interviewService.getAll();
      setSessions(res.data);
    } catch (err) {
      showToast('Failed to load interview history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await interviewService.delete(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      showToast('Interview session deleted successfully.', 'success');
    } catch (err) {
      showToast('Failed to delete interview session.', 'error');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-slate-400 text-sm">
        Loading interview sessions...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-600" />
            Mock Interview History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review past mock interview sessions, open comprehensive performance reports, and track your scores.
          </p>
        </div>

        <Link
          to="/interview/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition shrink-0"
        >
          <Sparkles className="w-4 h-4" /> Start New Interview
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Award className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">No Mock Interviews Conducted Yet</h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            Test your skills in realistic one-question-at-a-time simulations with instant AI feedback and communication metrics.
          </p>
          <Link
            to="/interview/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs transition"
          >
            <Sparkles className="w-4 h-4" /> Start Your First Mock Interview
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-bold text-slate-900">{session.interview_type}</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                    {session.difficulty}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 flex items-center gap-1">
                    {session.answer_method === 'voice' ? <Mic className="w-3 h-3 text-rose-500" /> : <MessageSquare className="w-3 h-3 text-blue-500" />}
                    {session.answer_method === 'voice' ? 'Voice' : 'Text'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    session.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {session.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600">
                  Target: <span className="font-semibold text-slate-800">{session.target_role || 'Software Engineer'}</span>
                  {session.target_company && ` at ${session.target_company}`}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(session.started_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                  <span>•</span>
                  <span>{session.questions_completed} of {session.total_questions_planned} questions</span>
                  <span>•</span>
                  <span className="text-slate-600 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {session.duration_minutes}m target
                  </span>
                </div>
              </div>

              {/* Score & Action Buttons */}
              <div className="flex items-center gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                {session.status === 'completed' && (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Score</span>
                    <span className="text-xl font-black text-emerald-600">{session.overall_score.toFixed(0)}%</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {session.status === 'completed' ? (
                    <button
                      onClick={() => navigate(`/interview/${session.id}/report`)}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Report
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/interview/${session.id}`)}
                      className="px-4 py-2 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      Resume Interview <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {confirmDeleteId === session.id ? (
                    <div className="flex items-center gap-1.5 bg-rose-50 p-1 rounded-xl border border-rose-200">
                      <span className="text-[11px] font-bold text-rose-700 px-1">Delete?</span>
                      <button
                        onClick={() => handleDelete(session.id)}
                        disabled={deletingId === session.id}
                        className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[11px] font-bold hover:bg-rose-700 transition"
                      >
                        {deletingId === session.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold hover:bg-slate-300 transition"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(session.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                      title="Delete interview session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InterviewHistory;
