import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewService, audioService } from '../services/api';
import { useToast } from '../context/ToastContext';
import VoiceRecorder from '../components/VoiceRecorder';
import {
  Clock,
  Send,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  HelpCircle,
  Tag,
  Lightbulb,
  MessageSquare,
  Mic,
  Award,
  ChevronRight,
  TrendingUp,
  XCircle,
  FileText
} from 'lucide-react';

const ActiveInterview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [loading, setLoading] = useState(true);

  // Answer state
  const [answerText, setAnswerText] = useState('');
  const [answerMethod, setAnswerMethod] = useState('text');
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordedAudioPath, setRecordedAudioPath] = useState(null);
  const [originalTranscript, setOriginalTranscript] = useState(null);

  // Post-submit evaluation feedback modal/card
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [isInterviewCompleted, setIsInterviewCompleted] = useState(false);

  // Timer state
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [showEndModal, setShowEndModal] = useState(false);
  const [isEndingEarly, setIsEndingEarly] = useState(false);

  useEffect(() => {
    fetchSession();
  }, [id]);

  // Timer countdown
  useEffect(() => {
    if (!session || session.status === 'completed' || secondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session, secondsRemaining]);

  const fetchSession = async () => {
    try {
      const res = await interviewService.getById(id);
      setSession(res.data);
      setAnswerMethod(res.data.answer_method || 'text');
      setCurrentQuestion(res.data.current_question);

      if (res.data.status === 'completed') {
        navigate(`/interview/${id}/report`);
        return;
      }

      // Initialize timer based on remaining duration
      const totalSecs = (res.data.duration_minutes || 15) * 60;
      const started = new Date(res.data.started_at).getTime();
      const elapsed = Math.floor((Date.now() - started) / 1000);
      setSecondsRemaining(Math.max(60, totalSecs - elapsed));
    } catch (err) {
      showToast('Failed to load interview session.', 'error');
      navigate('/interview/new');
    } finally {
      setLoading(false);
    }
  };

  const handleAudioRecorded = async (blob, duration) => {
    if (!blob) {
      setAudioBlob(null);
      setAudioDuration(0);
      setRecordedAudioPath(null);
      setOriginalTranscript(null);
      return;
    }

    setAudioBlob(blob);
    setAudioDuration(duration);
    setIsTranscribing(true);

    try {
      const formData = new FormData();
      formData.append('file', blob, 'answer.webm');
      const transRes = await audioService.transcribe(formData);
      const transcript = transRes.data.transcript || '';
      const audioPath = transRes.data.audio_path || null;

      setRecordedAudioPath(audioPath);
      setOriginalTranscript(transcript);
      setAnswerText(transcript);
      showToast('Voice transcribed locally with Faster-Whisper! Review or edit below.', 'success');
    } catch (err) {
      console.warn('Local Faster-Whisper transcription error:', err);
      showToast('Transcription note: you can review or type your answer in the box below.', 'info');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSubmitAnswer = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting || isTranscribing) return;

    const finalAnswerText = answerText.trim();
    if (!finalAnswerText) {
      showToast('Please provide an answer before submitting.', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit answer to backend (evaluated by Google Gemini)
      const res = await interviewService.submitAnswer(id, {
        answer_text: finalAnswerText,
        answer_method: answerMethod,
        audio_file_path: recordedAudioPath,
        transcript: originalTranscript || finalAnswerText,
        speaking_duration: audioDuration > 0 ? audioDuration : undefined
      });

      // Display evaluation feedback card
      setEvaluationResult(res.data);
      setIsInterviewCompleted(res.data.is_completed);

      // Reset input fields
      setAnswerText('');
      setAudioBlob(null);
      setAudioDuration(0);
      setRecordedAudioPath(null);
      setOriginalTranscript(null);

      showToast('Answer evaluated by Gemini AI!', 'success');
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to submit answer. Please try again.';
      showToast(detail, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProceedToNext = () => {
    if (isInterviewCompleted || !evaluationResult?.next_question) {
      navigate(`/interview/${id}/report`);
      return;
    }

    // Move to next question
    setCurrentQuestion(evaluationResult.next_question);
    setEvaluationResult(null);
    setSession((prev) => ({
      ...prev,
      questions_completed: (prev.questions_completed || 0) + 1
    }));
  };

  const handleEndInterviewEarly = async () => {
    setIsEndingEarly(true);
    try {
      await interviewService.finish(id);
      showToast('Interview completed. Generating performance report...', 'info');
      navigate(`/interview/${id}/report`);
    } catch (err) {
      showToast('Failed to end interview session.', 'error');
      setIsEndingEarly(false);
      setShowEndModal(false);
    }
  };

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="text-sm font-semibold">Initializing interview session...</span>
      </div>
    );
  }

  const currentOrder = currentQuestion?.question_order || 1;
  const totalPlanned = session?.total_questions_planned || 5;
  const progressPercent = Math.min(100, Math.round(((currentOrder - 1) / totalPlanned) * 100));

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Top Status Bar: Question Counter, Timer & End Interview */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200/50">
            Question {currentOrder} of {totalPlanned}
          </span>
          <span className="hidden sm:inline-block text-xs font-semibold text-slate-400">
            {session?.interview_type} • {session?.difficulty}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold ${
            secondsRemaining < 180 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-700'
          }`}>
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTimer(secondsRemaining)}</span>
          </div>

          {/* End Interview early button */}
          <button
            type="button"
            onClick={() => setShowEndModal(true)}
            className="text-xs font-semibold text-slate-400 hover:text-rose-600 transition"
          >
            End Interview
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Interactive Container */}
      {!evaluationResult ? (
        <div className="space-y-6">
          {/* Question Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                {currentQuestion?.question_category}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                {currentQuestion?.difficulty}
              </span>
              {currentQuestion?.is_follow_up && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                  Adaptive Follow-Up
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
              {currentQuestion?.question_text}
            </h2>
          </div>

          {/* Answer Input Area */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
            {answerMethod === 'voice' ? (
              <div className="space-y-4">
                <VoiceRecorder
                  onAudioRecorded={handleAudioRecorded}
                  isSubmitting={isSubmitting || isTranscribing}
                  onSwitchToText={() => setAnswerMethod('text')}
                />

                {/* Local Faster-Whisper Transcription Indicator */}
                {isTranscribing && (
                  <div className="p-4 rounded-2xl bg-indigo-50/90 border border-indigo-200/80 flex items-center gap-3 text-indigo-900 animate-pulse">
                    <Loader2 className="w-5 h-5 text-indigo-600 animate-spin shrink-0" />
                    <div>
                      <p className="text-xs font-bold">Transcribing speech locally with Faster-Whisper...</p>
                      <p className="text-[11px] text-indigo-600">Running private on-device speech-to-text without third-party audio APIs.</p>
                    </div>
                  </div>
                )}

                {/* Review & Edit Transcribed Answer */}
                {(answerText || audioBlob) && !isTranscribing && (
                  <div className="space-y-2 pt-2 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        Transcribed Answer (Review & Edit before Submitting):
                      </label>
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Faster-Whisper Ready
                      </span>
                    </div>
                    <textarea
                      rows={5}
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="Transcribed text will appear here. You can review, refine, or expand your answer before submitting..."
                      disabled={isSubmitting}
                      className="w-full p-4 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition"
                    />
                    <p className="text-[11px] text-slate-400">
                      You can edit or expand your answer above. Gemini evaluates your exact final text for maximum fairness.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    Your Answer
                  </label>
                  <button
                    type="button"
                    onClick={() => setAnswerMethod('voice')}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                  >
                    <Mic className="w-3.5 h-3.5" /> Switch to Voice Answer
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Structure your answer with clear rationale, technical decisions, and concrete examples..."
                  disabled={isSubmitting}
                  className="w-full p-4 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition"
                />
              </div>
            )}

            {/* Actions: Submit & Skip */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                Answers are evaluated immediately with Google Gemini and cannot be modified once submitted.
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSubmitAnswer}
                  disabled={isSubmitting || isTranscribing || !answerText.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Evaluating with Gemini...
                    </>
                  ) : (
                    <>
                      Submit Answer <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Instant Feedback Step */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6 animate-slide-up">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">AI Evaluation Feedback</h3>
                <p className="text-xs text-slate-400">Constructive breakdown of your submitted answer</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-semibold text-slate-400 uppercase">Answer Score</span>
              <p className="text-2xl font-black text-emerald-600">
                {evaluationResult.evaluation.overall_score.toFixed(1)} <span className="text-xs text-slate-400">/ 10</span>
              </p>
            </div>
          </div>

          {/* Sub-criteria score pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { label: 'Relevance', score: evaluationResult.evaluation.relevance_score },
              { label: 'Completeness', score: evaluationResult.evaluation.completeness_score },
              { label: 'Accuracy', score: evaluationResult.evaluation.accuracy_score },
              { label: 'Clarity', score: evaluationResult.evaluation.clarity_score },
              { label: 'Structure', score: evaluationResult.evaluation.structure_score },
              { label: 'Practical', score: evaluationResult.evaluation.practical_understanding_score },
            ].map((sc, i) => (
              <div key={i} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-center">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">{sc.label}</span>
                <span className="text-sm font-bold text-slate-800">{sc.score?.toFixed(1) || '—'}</span>
              </div>
            ))}
          </div>

          {/* Qualitative feedback */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-1">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> What You Did Well:
              </span>
              <p className="text-xs text-emerald-800 leading-relaxed">
                {evaluationResult.evaluation.what_did_well}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-1">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-600" /> Key Missing Information:
              </span>
              <p className="text-xs text-amber-800 leading-relaxed">
                {evaluationResult.evaluation.missing_information}
              </p>
            </div>
          </div>

          {/* How to Improve */}
          {evaluationResult.evaluation.how_to_improve && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-600" /> How to Improve:
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {evaluationResult.evaluation.how_to_improve}
              </p>
            </div>
          )}

          {/* Audio metrics if voice mode */}
          {evaluationResult.audio_analysis && (
            <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 text-xs text-indigo-950 flex items-center justify-between flex-wrap gap-3">
              <div>
                <span className="font-bold block">Acoustic Communication Analysis:</span>
                <p className="text-indigo-800 mt-0.5">{evaluationResult.audio_analysis.pause_information}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-100 font-bold text-indigo-900">
                  {evaluationResult.audio_analysis.words_per_minute} WPM
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-100 font-bold text-indigo-900">
                  {evaluationResult.audio_analysis.filler_word_count} Fillers
                </span>
              </div>
            </div>
          )}

          {/* Suggested Improved Answer */}
          {evaluationResult.evaluation.suggested_answer && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Suggested Model Response
              </span>
              <p className="text-xs text-slate-800 leading-relaxed italic whitespace-pre-line">
                "{evaluationResult.evaluation.suggested_answer}"
              </p>
            </div>
          )}

          {/* Proceed CTA Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleProceedToNext}
              className="px-7 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition"
            >
              {isInterviewCompleted ? (
                <>
                  View Performance Report <Award className="w-4 h-4" />
                </>
              ) : (
                <>
                  Proceed to Next Question <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal to End Interview Early */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">End Mock Interview Early?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your answered questions will be evaluated and compiled into a partial performance report. You will not be able to resume this session once ended.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
              >
                Continue Interview
              </button>
              <button
                type="button"
                onClick={handleEndInterviewEarly}
                disabled={isEndingEarly}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {isEndingEarly ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Yes, End & View Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveInterview;
