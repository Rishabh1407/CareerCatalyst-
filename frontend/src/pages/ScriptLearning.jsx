import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { prepService } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Sparkles,
  Layers,
  HelpCircle,
  Tag,
  Lightbulb,
  Check,
  RotateCcw,
  SlidersHorizontal,
  BookmarkCheck,
  AlertCircle
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

const ScriptLearning = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  const [prepSets, setPrepSets] = useState([]);
  const [selectedSetId, setSelectedSetId] = useState(null);
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'learned', 'unlearned'
  const [searchQuery, setSearchQuery] = useState('');

  // Expand / collapse map
  const [expandedMap, setExpandedMap] = useState({});

  // Fetch all prep sets
  useEffect(() => {
    const fetchSets = async () => {
      try {
        const res = await prepService.getAll();
        setPrepSets(res.data);
        const setQuery = searchParams.get('set');
        if (setQuery && res.data.some((s) => s.id === parseInt(setQuery))) {
          setSelectedSetId(parseInt(setQuery));
        } else if (res.data.length > 0) {
          setSelectedSetId(res.data[0].id);
        }
      } catch (err) {
        showToast('Failed to load preparation sets.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSets();
  }, []);

  // Fetch scripts whenever selected set changes
  useEffect(() => {
    if (!selectedSetId) return;

    const fetchScripts = async () => {
      try {
        const res = await prepService.getScripts(selectedSetId);
        setScripts(res.data);
        // Default expand first two
        const initialExpand = {};
        res.data.slice(0, 2).forEach((s) => {
          initialExpand[s.id] = true;
        });
        setExpandedMap(initialExpand);
      } catch (err) {
        showToast('Failed to load scripts for selected set.', 'error');
      }
    };
    fetchScripts();
  }, [selectedSetId]);

  const handleSetChange = (newId) => {
    setSelectedSetId(newId);
    setSearchParams({ set: newId });
  };

  const toggleExpand = (id) => {
    setExpandedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const all = {};
    scripts.forEach((s) => { all[s.id] = true; });
    setExpandedMap(all);
  };

  const collapseAll = () => {
    setExpandedMap({});
  };

  const handleToggleLearned = async (scriptId, currentStatus) => {
    const newStatus = !currentStatus;
    // Optimistic update
    setScripts((prev) =>
      prev.map((s) => (s.id === scriptId ? { ...s, is_learned: newStatus } : s))
    );

    try {
      await prepService.updateScriptStatus(scriptId, { is_learned: newStatus });
      showToast(newStatus ? 'Question marked as Mastered!' : 'Question marked for review.', 'success');
    } catch (err) {
      // Revert on failure
      setScripts((prev) =>
        prev.map((s) => (s.id === scriptId ? { ...s, is_learned: currentStatus } : s))
      );
      showToast('Could not update status. Please try again.', 'error');
    }
  };

  // Filtered scripts
  const filteredScripts = useMemo(() => {
    return scripts.filter((s) => {
      // Category filter
      if (selectedCategory !== 'All Categories') {
        const match = s.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
                      selectedCategory.toLowerCase().includes(s.category.toLowerCase());
        if (!match) return false;
      }
      // Status filter
      if (statusFilter === 'learned' && !s.is_learned) return false;
      if (statusFilter === 'unlearned' && s.is_learned) return false;
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inQuestion = s.question?.toLowerCase().includes(query);
        const inAnswer = s.suggested_answer?.toLowerCase().includes(query);
        const inExpl = s.explanation?.toLowerCase().includes(query);
        const inKeywords = s.important_keywords?.some((k) => k.toLowerCase().includes(query));
        if (!inQuestion && !inAnswer && !inExpl && !inKeywords) return false;
      }
      return true;
    });
  }, [scripts, selectedCategory, statusFilter, searchQuery]);

  const totalScripts = scripts.length;
  const learnedCount = scripts.filter((s) => s.is_learned).length;
  const progressPct = totalScripts > 0 ? Math.round((learnedCount / totalScripts) * 100) : 0;

  const currentSet = prepSets.find((s) => s.id === selectedSetId);

  // Helper to highlight keywords in text
  const renderHighlightedAnswer = (text, keywords) => {
    if (!keywords || keywords.length === 0) return text;
    // Simple regex replacement pattern for highlight
    const escaped = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).filter(Boolean);
    if (escaped.length === 0) return text;

    const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) => {
      const isMatch = keywords.some((k) => k.toLowerCase() === part.toLowerCase());
      if (isMatch) {
        return (
          <mark
            key={i}
            className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-semibold border-b-2 border-amber-400"
          >
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-slate-400 text-sm">
        Loading learning workspace...
      </div>
    );
  }

  if (prepSets.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center max-w-xl mx-auto space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <BookOpen className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">No Interview Preparation Sets Yet</h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          To study scripts, first generate personalized interview questions based on your candidate profile.
        </p>
        <Link
          to="/preparation"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs transition"
        >
          <Sparkles className="w-4 h-4" /> Generate First Prep Set
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-16">
      {/* Header & Set Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            Script Mastery & Learning
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Understand key patterns, highlight technical terms, and master your interview answers.
          </p>
        </div>

        {/* Set Selector Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Study Set:</label>
          <select
            value={selectedSetId || ''}
            onChange={(e) => handleSetChange(parseInt(e.target.value))}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-xs"
          >
            {prepSets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.total_questions} questions)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Progress & Overview Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              {currentSet?.interview_type} • {currentSet?.target_company || 'Target'}
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">{currentSet?.title}</h2>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-500">Mastery Progress</span>
              <p className="text-xl font-black text-indigo-600">
                {learnedCount} / {totalScripts} <span className="text-xs font-semibold text-slate-400">({progressPct}%)</span>
              </p>
            </div>
          </div>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Controls: Search, Filters & Expand All */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions, suggested answers, or keywords..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({scripts.length})
            </button>
            <button
              onClick={() => setStatusFilter('learned')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                statusFilter === 'learned'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Mastered ({learnedCount})
            </button>
            <button
              onClick={() => setStatusFilter('unlearned')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                statusFilter === 'unlearned'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Needs Practice ({totalScripts - learnedCount})
            </button>
          </div>

          {/* Expand/Collapse Toggle */}
          <div className="flex items-center gap-1 shrink-0 border-l border-slate-200 pl-2">
            <button
              onClick={expandAll}
              className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              title="Expand all questions"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              title="Collapse all questions"
            >
              Collapse
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Script List */}
      <div className="space-y-4">
        {filteredScripts.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-2">
            <p className="text-sm font-bold text-slate-700">No questions match your current filters</p>
            <p className="text-xs text-slate-400">Try clearing the search query or selecting a different category.</p>
          </div>
        ) : (
          filteredScripts.map((script) => {
            const isExpanded = !!expandedMap[script.id];
            return (
              <div
                key={script.id}
                className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs overflow-hidden ${
                  script.is_learned
                    ? 'border-emerald-200 bg-emerald-50/10'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Header row: Question, Badges, Toggle Buttons */}
                <div className="p-5 flex items-start justify-between gap-4">
                  <div
                    className="flex-1 cursor-pointer select-none"
                    onClick={() => toggleExpand(script.id)}
                  >
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/50">
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
                      {script.is_learned && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Mastered
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug hover:text-indigo-600 transition">
                      {script.question}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Mark as Learned Button */}
                    <button
                      onClick={() => handleToggleLearned(script.id, script.is_learned)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                        script.is_learned
                          ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 ${script.is_learned ? 'text-emerald-700' : 'text-slate-400'}`} />
                      {script.is_learned ? 'Mastered' : 'Mark Learned'}
                    </button>

                    {/* Expand/Collapse Chevron */}
                    <button
                      onClick={() => toggleExpand(script.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Content */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 space-y-4 border-t border-slate-100 animate-fade-in">
                    {/* Suggested Answer with Highlighted Keywords */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Suggested Personalized Script
                        </span>
                        <span className="text-[10px] text-slate-400 italic">
                          Highlighted terms are key concepts to remember
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                        {renderHighlightedAnswer(script.suggested_answer, script.important_keywords)}
                      </p>
                    </div>

                    {/* Key Keywords Chips */}
                    {script.important_keywords && script.important_keywords.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                          <Tag className="w-3 h-3 text-indigo-500" /> Key Keywords:
                        </span>
                        {script.important_keywords.map((kw, kwIdx) => (
                          <span
                            key={kwIdx}
                            className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Key Points to Remember (Bullet checklist) */}
                    {script.key_points && script.key_points.length > 0 && (
                      <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-200/60 space-y-2">
                        <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                          <Lightbulb className="w-4 h-4 text-amber-600" />
                          Key Points to Remember (Understanding over Memorization)
                        </span>
                        <ul className="space-y-1 text-xs text-amber-800">
                          {script.key_points.map((pt, pIdx) => (
                            <li key={pIdx} className="flex items-start gap-2">
                              <span className="text-amber-500 font-bold">•</span>
                              <span className="leading-relaxed">{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Technical Explanation / Why Interviewer Asks This */}
                    {script.explanation && (
                      <div className="p-3.5 rounded-xl bg-slate-100/70 text-xs text-slate-700 space-y-1">
                        <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                          Interviewer Mindset & Evaluation Criteria
                        </span>
                        <p className="leading-relaxed text-slate-600">{script.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ScriptLearning;
