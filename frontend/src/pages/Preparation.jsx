import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { prepService } from '../services/api';
import {
  Sparkles,
  BookOpen,
  Layers,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Tag,
  Briefcase,
  Building2,
  Target,
  FileText,
  KeyRound,
  ExternalLink,
  RotateCcw
} from 'lucide-react';

const CATEGORIES = [
  'All Categories',
  'Self-Introduction',
  'HR & Behavioral',
  'Technical',
  'Project-Based',
  'Role-Specific',
  'Company-Oriented'
];

const Preparation = () => {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [targetRole, setTargetRole] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [interviewType, setInterviewType] = useState('Comprehensive');
  const [jobDescription, setJobDescription] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [currentPrepSet, setCurrentPrepSet] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [errorDetails, setErrorDetails] = useState(null);

  // If a view ID is in the query params, load it
  useEffect(() => {
    const viewId = searchParams.get('view');
    if (viewId) {
      loadPreparationSet(viewId);
    } else if (profile) {
      setTargetRole(profile.target_role || '');
      setTargetCompany(profile.target_company || '');
      setInterviewType(profile.interview_type || 'Comprehensive');
      setJobDescription(profile.job_description || '');
    }
  }, [searchParams, profile]);

  const loadPreparationSet = async (id) => {
    try {
      const res = await prepService.getById(id);
      setCurrentPrepSet(res.data);
    } catch (err) {
      showToast('Could not load preparation set.', 'error');
    }
  };

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (isGenerating) return; // Prevent double submission

    setErrorDetails(null);
    setIsGenerating(true);
    setGenerationStep('Analyzing candidate profile and career goals...');

    const timer1 = setTimeout(() => {
      setGenerationStep('Synthesizing questions across 6 core interview categories...');
    }, 4000);

    const timer2 = setTimeout(() => {
      setGenerationStep('Personalizing answers, keyword frameworks, and key points via Gemini...');
    }, 9000);

    const payload = {
      target_role: targetRole || profile?.target_role || 'Software Engineer',
      target_company: targetCompany || profile?.target_company || 'Technology Company',
      interview_type: interviewType,
      job_description: jobDescription
    };

    try {
      const res = await prepService.generate(payload);
      clearTimeout(timer1);
      clearTimeout(timer2);
      setGenerationStep('');
      setCurrentPrepSet(res.data);
      showToast('Interview preparation generated successfully!', 'success');

      // Scroll smoothly down to the generated results
      setTimeout(() => {
        const el = document.getElementById('generated-results');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } catch (err) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setGenerationStep('');
      let detail = 'Failed to generate preparation material. Please try again.';
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        detail = 'Generation timed out. Google Gemini is taking longer than expected. Please click Retry below.';
      } else if (err.response?.data?.detail) {
        detail = err.response.data.detail;
      } else if (err.message) {
        detail = err.message;
      }
      setErrorDetails(detail);
      showToast(detail, 'error');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const filteredScripts = currentPrepSet?.scripts?.filter((s) => {
    if (selectedCategory === 'All Categories') return true;
    return s.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
           selectedCategory.toLowerCase().includes(s.category.toLowerCase());
  }) || [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in pb-16">
      {/* Page Title & Explanation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            AI Interview Preparation Generator
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Generate deeply personalized questions and structured answers grounded strictly in your real background.
          </p>
        </div>

        {currentPrepSet && (
          <button
            onClick={() => navigate(`/script-learning?set=${currentPrepSet.id}`)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition shrink-0"
          >
            <BookOpen className="w-4 h-4" />
            Study in Script Learning
          </button>
        )}
      </div>

      {/* Generator Form Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Preparation Configuration
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">Pre-filled from your profile</span>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Job Role</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Frontend Engineer"
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
                placeholder="e.g. Google, Amazon, Stripe"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Interview Focus</label>
              <select
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="Comprehensive">Comprehensive (All 6 Categories)</option>
                <option value="Technical Focused">Technical Focused</option>
                <option value="HR & Behavioral">HR & Behavioral</option>
                <option value="Company Specific">Company Specific</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Job Description / Custom Focus (Optional)
            </label>
            <textarea
              rows={2}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste specific requirements from the job posting to ensure the AI addresses key qualifications..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Generates self-intro, behavioral, technical, project, and company questions.
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 transition disabled:opacity-70"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating AI Preparation...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Preparation Set
                </>
              )}
            </button>
          </div>

          {/* Live Generation Progress Card */}
          {isGenerating && (
            <div className="p-4 rounded-xl bg-blue-50/90 border border-blue-200/80 flex items-center gap-3 text-blue-900 animate-pulse">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold">{generationStep || 'Personalizing preparation package with Google Gemini...'}</p>
                <p className="text-[11px] text-blue-700 mt-0.5">Enforcing structured output and educational grounding in your profile.</p>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Error Callout */}
      {errorDetails && (
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-4 animate-slide-up">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold">Google Gemini Generation Notice</p>
              <p className="text-xs text-rose-700 mt-1 leading-relaxed">{errorDetails}</p>
            </div>
          </div>

          {errorDetails.toLowerCase().includes('api key') || errorDetails.toLowerCase().includes('authentication') ? (
            <div className="bg-white/80 rounded-xl p-3 text-xs text-slate-700 space-y-1.5 border border-rose-100">
              <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                How to configure your Google Gemini API Key:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-600">
                <li>Open <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">backend/.env</code> in your workspace.</li>
                <li>Set <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">GEMINI_API_KEY=...</code> with your Google Gemini key.</li>
                <li>Restart or reload the backend server, and click <strong>Generate Preparation Set</strong> again.</li>
              </ol>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-white/80 rounded-xl p-3 border border-rose-100 flex-wrap gap-2">
              <span className="text-xs text-slate-700 font-medium">
                Your configuration is preserved above. You can retry immediately:
              </span>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry Generation
              </button>
            </div>
          )}
        </div>
      )}

      {/* Display Generated Preparation Set */}
      {currentPrepSet && (
        <div id="generated-results" className="space-y-6">
          {/* Summary Banner */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
                  {currentPrepSet.interview_type} Preparation
                </span>
                <h2 className="text-xl font-bold mt-1">{currentPrepSet.title}</h2>
                <p className="text-xs text-slate-300 mt-2 max-w-2xl leading-relaxed">
                  {currentPrepSet.overview}
                </p>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <p className="text-xs text-slate-400">Total Items</p>
                <p className="text-2xl font-black text-white">{currentPrepSet.total_questions}</p>
              </div>
            </div>
          </div>

          {/* Categories Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Questions Grid */}
          <div className="space-y-4">
            {filteredScripts.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
                No questions found under this category filter.
              </div>
            ) : (
              filteredScripts.map((script, idx) => (
                <div
                  key={script.id || idx}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/50">
                          {script.category}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            script.difficulty === 'Beginner'
                              ? 'bg-emerald-50 text-emerald-700'
                              : script.difficulty === 'Advanced'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {script.difficulty}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {script.question}
                      </h3>
                    </div>
                  </div>

                  {/* Suggested Answer */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Suggested Answer (Personalized to your profile)
                    </span>
                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                      {script.suggested_answer}
                    </p>
                  </div>

                  {/* Keywords */}
                  {script.important_keywords && script.important_keywords.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="font-semibold text-slate-500 flex items-center gap-1 text-[11px]">
                        <Tag className="w-3 h-3 text-blue-500" /> Keywords:
                      </span>
                      {script.important_keywords.map((kw, kIdx) => (
                        <span
                          key={kIdx}
                          className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-medium"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Explanation / Why Asked */}
                  {script.explanation && (
                    <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-900 flex items-start gap-2.5">
                      <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-indigo-950 mb-0.5">Why the interviewer asks this & concept key:</span>
                        <p className="leading-relaxed">{script.explanation}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Preparation;
