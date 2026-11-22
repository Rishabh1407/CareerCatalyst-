import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { prepService, interviewService } from '../services/api';
import {
  Sparkles,
  BookOpen,
  History,
  User,
  ArrowRight,
  CheckCircle2,
  Clock,
  Briefcase,
  Building2,
  Layers,
  Mic,
  BarChart3,
  Lock,
  ChevronRight,
  TrendingUp,
  Award,
  Video,
  Users
} from 'lucide-react';

const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [prepSummary, setPrepSummary] = useState(null);
  const [interviewStats, setInterviewStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [prepRes, interviewRes] = await Promise.allSettled([
          prepService.getSummary(),
          interviewService.getSummaryStats()
        ]);
        if (prepRes.status === 'fulfilled') setPrepSummary(prepRes.value.data);
        if (interviewRes.status === 'fulfilled') setInterviewStats(interviewRes.value.data);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const completion = profile?.completion_percentage || 0;
  const candidateName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Candidate';

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Top Banner / Welcome with Interactive CTAs */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 transform skew-x-12 pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold uppercase tracking-wider backdrop-blur-xs mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" /> Complete AI Prep & Mock Platform
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome back, {candidateName}!
          </h1>
          <p className="mt-2 text-blue-100 text-sm leading-relaxed">
            {profile?.target_role ? (
              <>
                Preparing for <span className="font-semibold text-white">{profile.target_role}</span>{' '}
                {profile.target_company ? `at ${profile.target_company}` : ''}. Master your personalized talking points, or practice in a real-time AI mock interview.
              </>
            ) : (
              <>Set up your target role and let AI build customized interview scripts and interactive simulations directly matching your projects.</>
            )}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/interview/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-700 font-bold text-sm shadow-md hover:bg-blue-50 transition"
            >
              <Mic className="w-4 h-4 text-rose-600" />
              Start Mock Interview
            </Link>
            <Link
              to="/preparation"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-xs transition"
            >
              <Sparkles className="w-4 h-4" />
              Generate Prep Set
            </Link>
            <Link
              to="/script-learning"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-xs transition"
            >
              <BookOpen className="w-4 h-4" />
              Study Scripts
            </Link>
          </div>
        </div>
      </div>

      {/* Profile Completion Callout if not 100% */}
      {completion < 80 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">
                Your profile is {completion}% complete
              </p>
              <p className="text-xs text-amber-700">
                Add your projects, programming languages, and target company to get 100% grounded AI mock questions and answers.
              </p>
            </div>
          </div>
          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shrink-0 transition"
          >
            Complete Profile <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Mock Interview Performance Metrics Row (Phase 2 Live) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600" />
            Mock Interview Readiness (Phase 2)
          </h2>
          <Link to="/analytics" className="text-xs font-semibold text-blue-600 hover:underline">
            View Analytics →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Interviews Completed</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Mic className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{interviewStats?.total_interviews || 0}</p>
            <p className="text-xs text-slate-400 mt-1">Full sessions simulated</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Interview Score</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-indigo-600 mt-2">
              {interviewStats?.average_score ? `${interviewStats.average_score.toFixed(0)}%` : '—'}
            </p>
            <p className="text-xs text-slate-400 mt-1">Evaluated by AI</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Best Performance</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-600 mt-2">
              {interviewStats?.best_score ? `${interviewStats.best_score.toFixed(0)}%` : '—'}
            </p>
            <p className="text-xs text-emerald-600 font-semibold mt-1">Highest result</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Questions Answered</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{interviewStats?.total_questions_answered || 0}</p>
            <p className="text-xs text-slate-400 mt-1">Mock questions evaluated</p>
          </div>
        </div>
      </div>

      {/* Preparation Metrics Row (Phase 1 Preserved) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            Study & Script Mastery (Phase 1)
          </h2>
          <Link to="/script-learning" className="text-xs font-semibold text-blue-600 hover:underline">
            Study Scripts →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Preparation Sets</span>
            <p className="text-2xl font-black text-slate-900 mt-2">{prepSummary?.total_sets || 0}</p>
            <p className="text-xs text-slate-400 mt-1">Saved study sets</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Questions</span>
            <p className="text-2xl font-black text-slate-900 mt-2">{prepSummary?.total_questions || 0}</p>
            <p className="text-xs text-slate-400 mt-1">AI-generated answers</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Learned Questions</span>
            <p className="text-2xl font-black text-slate-900 mt-2">{prepSummary?.learned_questions || 0}</p>
            <p className="text-xs text-emerald-600 font-semibold mt-1">Mastered talking points</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Mastery Rate</span>
            <p className="text-2xl font-black text-slate-900 mt-2">{prepSummary?.progress_percentage || 0}%</p>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-purple-600 h-1.5 rounded-full"
                style={{ width: `${prepSummary?.progress_percentage || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Activity & Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols): Recent Mock Interviews & Recent Prep Sets */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Mock Interviews */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Mic className="w-4 h-4 text-rose-500" />
                Latest Mock Interview Simulations
              </h2>
              <Link to="/interview/history" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                All Interviews <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-sm">
                Loading interviews...
              </div>
            ) : !interviewStats?.recent_sessions || interviewStats.recent_sessions.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200/80 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                  <Mic className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800">No mock interviews completed yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Simulate an actual interview one question at a time using text or voice, and receive instant feedback.
                </p>
                <Link
                  to="/interview/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  <Mic className="w-3.5 h-3.5" /> Start Mock Interview
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {interviewStats.recent_sessions.slice(0, 3).map((session) => (
                  <div
                    key={session.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-blue-300 hover:shadow-xs transition group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                          {session.interview_type}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700">
                          {session.difficulty}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                          {session.answer_method}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{session.target_role || 'Candidate'}</span>
                        <span>•</span>
                        <span>{session.questions_completed} questions</span>
                        <span>•</span>
                        <span>{new Date(session.started_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Score</span>
                        <span className="text-xl font-black text-emerald-600">{session.overall_score.toFixed(0)}%</span>
                      </div>
                      <Link
                        to={`/interview/${session.id}/report`}
                        className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl text-xs font-semibold transition"
                      >
                        Report
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Preparation Sets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Recently Generated Preparation Sets
              </h2>
              <Link to="/history" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                All Prep Sets <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {!prepSummary?.recent_sets || prepSummary.recent_sets.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 text-center text-xs text-slate-400">
                No preparation sets generated yet.{' '}
                <Link to="/preparation" className="text-blue-600 font-semibold hover:underline">
                  Generate your first set →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {prepSummary.recent_sets.slice(0, 3).map((set) => (
                  <div
                    key={set.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-blue-300 transition flex items-center justify-between gap-4"
                  >
                    <div>
                      <span className="text-sm font-bold text-slate-900 block">{set.title}</span>
                      <span className="text-xs text-slate-400">
                        {set.total_questions} questions • {set.learned_questions} mastered
                      </span>
                    </div>
                    <Link
                      to={`/script-learning?set=${set.id}`}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg text-xs font-semibold transition"
                    >
                      Study Scripts
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Navigation & Future Roadmap */}
        <div className="space-y-6">
          {/* Quick Navigation Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                to="/interview/new"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-xs font-semibold transition group"
              >
                <div className="flex items-center gap-2.5">
                  <Mic className="w-4 h-4 text-rose-600" />
                  <span>Start Mock Interview</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600" />
              </Link>

              <Link
                to="/preparation"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-semibold transition group"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Generate AI Prep Set</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
              </Link>

              <Link
                to="/script-learning"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-semibold transition group"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Study Script Questions</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
              </Link>

              <Link
                to="/analytics"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-purple-50 hover:text-purple-700 text-slate-700 text-xs font-semibold transition group"
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  <span>Performance Analytics</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600" />
              </Link>
            </div>
          </div>

          {/* Future Roadmap Card */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Phase 3 Vision</h3>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Next Era
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Multi-interviewer panel rounds and live web-camera eye-contact tracking are scheduled for Phase 3.
            </p>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-xs text-slate-300 font-medium">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>Multi-Interviewer Panel</span>
                </div>
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-xs text-slate-300 font-medium">
                  <Video className="w-4 h-4 text-slate-400" />
                  <span>Computer Vision & Eye Contact</span>
                </div>
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
