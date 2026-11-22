import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { prepService } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  History,
  Trash2,
  BookOpen,
  Eye,
  Calendar,
  Layers,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

const PreparationHistory = () => {
  const [prepSets, setPrepSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchHistory = async () => {
    try {
      const res = await prepService.getAll();
      setPrepSets(res.data);
    } catch (err) {
      showToast('Failed to load preparation history.', 'error');
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
      await prepService.delete(id);
      setPrepSets((prev) => prev.filter((s) => s.id !== id));
      showToast('Preparation set deleted successfully.', 'success');
    } catch (err) {
      showToast('Failed to delete preparation set.', 'error');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-slate-400 text-sm">
        Loading preparation history...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600" />
            Preparation History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse and manage all previously generated personalized interview preparation sets.
          </p>
        </div>

        <Link
          to="/preparation"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          Generate New Set
        </Link>
      </div>

      {prepSets.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Layers className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">No History Available</h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            All your generated interview preparation sets will be preserved here across sessions.
          </p>
          <Link
            to="/preparation"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs transition"
          >
            <Sparkles className="w-4 h-4" /> Generate Your First Set
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {prepSets.map((set) => (
            <div
              key={set.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-bold text-slate-900">{set.title}</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/50">
                    {set.interview_type}
                  </span>
                </div>

                {set.overview && (
                  <p className="text-xs text-slate-600 line-clamp-2 max-w-2xl leading-relaxed">
                    {set.overview}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(set.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                  <span>•</span>
                  <span>{set.total_questions} total questions</span>
                  <span>•</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {set.learned_questions} mastered
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <button
                  onClick={() => navigate(`/script-learning?set=${set.id}`)}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Study Scripts
                </button>

                <button
                  onClick={() => navigate(`/preparation?view=${set.id}`)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" /> Details
                </button>

                {confirmDeleteId === set.id ? (
                  <div className="flex items-center gap-1.5 bg-rose-50 p-1 rounded-xl border border-rose-200">
                    <span className="text-[11px] font-bold text-rose-700 px-1">Delete?</span>
                    <button
                      onClick={() => handleDelete(set.id)}
                      disabled={deletingId === set.id}
                      className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[11px] font-bold hover:bg-rose-700 transition"
                    >
                      {deletingId === set.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes'}
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
                    onClick={() => setConfirmDeleteId(set.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                    title="Delete preparation set"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PreparationHistory;
