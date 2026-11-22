import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { reportService } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Award,
  Calendar,
  Clock,
  Target,
  Building2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Lightbulb,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Volume2,
  Layers,
  ArrowRight,
  RotateCcw,
  Tag,
  Loader2,
  HelpCircle,
  Compass
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

const InterviewReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedAnswer, setExpandedAnswer] = useState({});

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      const res = await reportService.getById(id);
      setReport(res.data);
      // Default expand first question
      setExpandedAnswer({ 1: true });
    } catch (err) {
      showToast('Failed to load performance report.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (qNum) => {
    setExpandedAnswer((prev) => ({ ...prev, [qNum]: !prev[qNum] }));
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="text-sm font-semibold">Compiling performance report...</span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center max-w-xl mx-auto space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Report Not Found</h2>
        <p className="text-xs text-slate-500">This interview session could not be located.</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Format category scores data for Recharts
  const chartData = report.category_scores.map((c) => ({
    category: c.category,
    score: c.score,
    fullMark: 100
  }));

  const formatSeconds = (total) => {
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* SECTION A & B: Executive Score Header & Overview Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider border border-blue-400/30">
              <Award className="w-3.5 h-3.5" /> Performance Report
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {report.interview_type}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Targeting <span className="font-bold text-white">{report.target_role}</span> at{' '}
              <span className="font-bold text-white">{report.target_company}</span>.
            </p>
          </div>

          {/* Overall Performance Meter */}
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 text-center shrink-0 min-w-[180px]">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Overall Performance
            </span>
            <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 mt-1">
              {report.overall_score.toFixed(0)}
              <span className="text-base text-slate-400 font-semibold">/100</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 font-medium">
              Avg: {report.average_answer_score.toFixed(1)} / 10 per answer
            </p>
          </div>
        </div>

        {/* Overview Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Difficulty</span>
            <span className="font-bold text-slate-200">{report.difficulty}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Duration</span>
            <span className="font-bold text-slate-200">
              {report.actual_duration_seconds > 0 ? formatSeconds(report.actual_duration_seconds) : `${report.duration_minutes} mins`}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Questions Completed</span>
            <span className="font-bold text-slate-200">
              {report.completed_questions} of {report.total_questions}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Answer Mode</span>
            <span className="font-bold text-slate-200 uppercase">{report.answer_method}</span>
          </div>
        </div>
      </div>

      {/* SECTION C: Category-Wise Performance Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">
                Category-Wise Performance
              </h2>
            </div>
            <span className="text-xs text-slate-400">Score out of 100</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
                <XAxis dataKey="category" angle={-15} textAnchor="end" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Score']}
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '12px', fontSize: '12px', border: 'none' }}
                />
                <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
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
      )}

      {/* SECTION E & F: Strengths and Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="text-slate-900 font-bold">Key Candidate Strengths</h3>
          </div>
          <ul className="space-y-2.5">
            {report.strengths.map((s, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Areas for Improvement */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
            <AlertCircle className="w-5 h-5" />
            <h3 className="text-slate-900 font-bold">Areas for Growth</h3>
          </div>
          <ul className="space-y-2.5">
            {report.weaknesses.map((w, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* SECTION G: Actionable Recommendations */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
          <Lightbulb className="w-5 h-5" />
          <h3 className="text-slate-900 font-bold">Actionable Coaching Recommendations</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {report.recommendations.map((rec, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                Action Item #{idx + 1}
              </span>
              <p className="text-xs text-indigo-950 font-medium leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION H: Communication & Speech Analysis */}
      {report.communication_analysis && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Volume2 className="w-5 h-5 text-rose-500" />
              <h3>Acoustic & Communication Observations</h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">
              Mode: {report.communication_analysis.mode}
            </span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed">
            {report.communication_analysis.observation}
          </p>

          {report.communication_analysis.mode === 'voice' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-center">
                <span className="text-[10px] text-slate-400 uppercase block">Speaking Rate</span>
                <span className="text-base font-black text-slate-800">
                  {report.communication_analysis.overall_words_per_minute || 0} WPM
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-center">
                <span className="text-[10px] text-slate-400 uppercase block">Spoken Duration</span>
                <span className="text-base font-black text-slate-800">
                  {report.communication_analysis.total_speaking_duration_seconds || 0}s
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-center">
                <span className="text-[10px] text-slate-400 uppercase block">Total Fillers</span>
                <span className="text-base font-black text-slate-800">
                  {report.communication_analysis.total_filler_words || 0}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-center">
                <span className="text-[10px] text-slate-400 uppercase block">Cadence</span>
                <span className="text-base font-black text-emerald-600">Natural</span>
              </div>
            </div>
          )}

          {report.communication_analysis.limitation_note && (
            <p className="text-[11px] text-slate-400 italic pt-1">
              Note: {report.communication_analysis.limitation_note}
            </p>
          )}
        </div>
      )}

      {/* SECTION D: Answer-Wise Evaluation Details */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              Question-by-Question Evaluation Details
            </h3>
          </div>
          <span className="text-xs text-slate-400">{report.answers_evaluation.length} questions answered</span>
        </div>

        <div className="space-y-3">
          {report.answers_evaluation.map((item) => {
            const isExpanded = !!expandedAnswer[item.question_order];
            return (
              <div
                key={item.question_order}
                className="rounded-2xl border border-slate-200 overflow-hidden transition"
              >
                {/* Header row */}
                <div
                  onClick={() => toggleExpand(item.question_order)}
                  className="p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50 select-none transition"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        Q{item.question_order}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                        {item.category}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                        {item.difficulty}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{item.question}</h4>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-sm font-black text-emerald-600">{item.score.toFixed(1)}</span>
                      <span className="text-[10px] text-slate-400 font-semibold"> / 10</span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* Collapsible Details */}
                {isExpanded && item.evaluation && (
                  <div className="p-5 pt-0 space-y-4 border-t border-slate-100 bg-slate-50/40 animate-fade-in text-xs">
                    {/* Candidate Answer */}
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200/70 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Your Submitted Response
                      </span>
                      <p className="text-slate-800 leading-relaxed whitespace-pre-line">{item.candidate_answer}</p>
                    </div>

                    {/* What went well & Missing info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                          Strengths
                        </span>
                        <p className="text-emerald-950 leading-relaxed">{item.evaluation.what_did_well}</p>
                      </div>

                      <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-100 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                          Missing Information
                        </span>
                        <p className="text-amber-950 leading-relaxed">{item.evaluation.missing_information}</p>
                      </div>
                    </div>

                    {/* How to improve */}
                    {item.evaluation.how_to_improve && (
                      <div className="p-3.5 bg-white rounded-xl border border-slate-200/70 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                          Coaching Tip:
                        </span>
                        <p className="text-slate-800 leading-relaxed">{item.evaluation.how_to_improve}</p>
                      </div>
                    )}

                    {/* Model Answer */}
                    {item.evaluation.suggested_answer && (
                      <div className="p-3.5 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                          Suggested Model Answer
                        </span>
                        <p className="text-indigo-950 leading-relaxed italic whitespace-pre-line">
                          "{item.evaluation.suggested_answer}"
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION I: Next Steps & Bottom Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-200">
        <Link
          to="/interview/history"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Back to Interview History
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/script-learning"
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" /> Study in Script Learning
          </Link>
          <Link
            to="/interview/new"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> Start Another Mock Interview
          </Link>
        </div>
      </div>
    </div>
  );
};

export default InterviewReport;
