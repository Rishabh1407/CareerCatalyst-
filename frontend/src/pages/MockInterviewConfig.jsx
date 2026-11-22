import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { interviewService } from '../services/api';
import {
  Mic,
  MessageSquare,
  Clock,
  Sparkles,
  Target,
  Building2,
  Briefcase,
  Play,
  Loader2,
  CheckCircle2,
  Sliders,
  Layers,
  ArrowRight
} from 'lucide-react';

const INTERVIEW_TYPES = [
  { id: 'Comprehensive Interview', name: 'Comprehensive', desc: 'Mix of self-intro, technical concepts, project architecture, and behavioral questions.' },
  { id: 'Technical Interview', name: 'Technical Concepts', desc: 'Deep dive into programming languages, system architecture, database optimization, and core CS fundamentals.' },
  { id: 'Project-Based Interview', name: 'Project Deep-Dive', desc: 'Probing actual projects from your profile: bottlenecks, trade-offs, tech stack choices, and individual contributions.' },
  { id: 'HR Interview', name: 'HR & Behavioral', desc: 'STAR method questions focusing on conflict resolution, leadership, failure recovery, and team dynamics.' },
  { id: 'Role-Specific Interview', name: 'Role-Specific', desc: 'Directly tailored to expectations and qualifications of your target job role and posting.' },
];

const MockInterviewConfig = () => {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [interviewType, setInterviewType] = useState('Comprehensive Interview');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [answerMethod, setAnswerMethod] = useState('text');
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [targetRole, setTargetRole] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (profile) {
      setTargetRole(profile.target_role || 'Software Engineer');
      setTargetCompany(profile.target_company || 'Technology Company');
      setJobDescription(profile.job_description || '');
    }
  }, [profile]);

  const handleStart = async (e) => {
    e.preventDefault();
    setIsStarting(true);
    try {
      const res = await interviewService.start({
        interview_type: interviewType,
        difficulty,
        duration_minutes: durationMinutes,
        answer_method: answerMethod,
        target_role: targetRole,
        target_company: targetCompany,
        job_description: jobDescription,
        total_questions: totalQuestions
      });

      showToast('Interview session initialized! First question ready.', 'success');
      navigate(`/interview/${res.data.id}`);
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to start interview session.';
      showToast(detail, 'error');
      setIsStarting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" /> Interactive Simulation
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Configure AI Mock Interview</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-xl">
          Conduct a realistic one-question-at-a-time interview with adaptive follow-ups, constructive instant feedback, and an executive performance report.
        </p>
      </div>

      <form onSubmit={handleStart} className="space-y-6">
        {/* 1. Interview Type Selection */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Layers className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">1. Select Interview Type</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {INTERVIEW_TYPES.map((type) => {
              const isSelected = interviewType === type.id;
              return (
                <div
                  key={type.id}
                  onClick={() => setInterviewType(type.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200/80 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-bold ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                        {type.name}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{type.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Format & Difficulty */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Difficulty */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                <button
                  type="button"
                  key={lvl}
                  onClick={() => setDifficulty(lvl)}
                  className={`py-2 px-1 text-xs font-bold rounded-xl transition ${
                    difficulty === lvl
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              {difficulty === 'Beginner' && 'Focuses on fundamentals, syntax, and basic architectural patterns.'}
              {difficulty === 'Intermediate' && 'Balanced mix of practical problems, implementation trade-offs, and system concepts.'}
              {difficulty === 'Advanced' && 'Deep architecture bottlenecks, scale concurrency, and complex edge cases.'}
            </p>
          </div>

          {/* Duration & Questions */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              Questions & Target Time
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { q: 3, m: 10 },
                { q: 5, m: 15 },
                { q: 8, m: 25 },
              ].map((item) => (
                <button
                  type="button"
                  key={item.q}
                  onClick={() => {
                    setTotalQuestions(item.q);
                    setDurationMinutes(item.m);
                  }}
                  className={`py-2 px-1 text-xs font-bold rounded-xl flex flex-col items-center transition ${
                    totalQuestions === item.q
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{item.q} Qs</span>
                  <span className="text-[10px] font-normal opacity-80">{item.m} mins</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              Target pace: ~3 minutes per question including AI feedback.
            </p>
          </div>

          {/* Answer Method: Text vs Voice */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              Answer Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAnswerMethod('text')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                  answerMethod === 'text'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Text Input
              </button>

              <button
                type="button"
                onClick={() => setAnswerMethod('voice')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                  answerMethod === 'voice'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Mic className="w-3.5 h-3.5" /> Voice Audio
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              {answerMethod === 'voice'
                ? 'Records audio in browser, measures speaking pace, filler words, and transcribes answers.'
                : 'Allows careful typing and editing of your answers before submission.'}
            </p>
          </div>
        </div>

        {/* 3. Target Career Preferences & Role Alignment */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                3. Career Target Alignment
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">Personalized from your profile</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Job Role</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Full-Stack Developer or Cloud Architect"
                required
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Company</label>
              <input
                type="text"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="e.g. Google, Stripe, or High-Growth Startup"
                required
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Job Description / Posting Details (Optional)
              </label>
              <textarea
                rows={2}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste requirements to guide the AI questions toward specific framework or domain expectations..."
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Profile-grounded questions with real-time AI scoring</span>
          </div>

          <button
            type="submit"
            disabled={isStarting}
            className="px-8 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold rounded-2xl text-sm shadow-lg shadow-blue-500/25 flex items-center gap-2.5 transition disabled:opacity-70"
          >
            {isStarting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Initializing AI Interview...
              </>
            ) : (
              <>
                Start AI Mock Interview <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MockInterviewConfig;
