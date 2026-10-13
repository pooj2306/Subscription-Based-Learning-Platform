import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getAdaptiveQuiz,
  submitAdaptiveQuiz,
  startInteractiveAdaptiveQuiz,
  submitInteractiveAnswer,
} from '../../api/adaptiveApi';
import DashboardLayout from '../../components/DashboardLayout';
import BackLink from '../../components/BackLink';

const LEVEL_CONFIG = {
  1: {
    bg: 'bg-brand-50 dark:bg-brand-900/30',
    border: 'border-brand-300 dark:border-brand-800',
    text: 'text-brand-700 dark:text-indigo-300',
    badgeBg: 'bg-brand-600',
    label: 'Level 1: Easy',
    color: 'emerald',
    icon: '🌱',
  },
  2: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-300 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-200',
    badgeBg: 'bg-amber-500',
    label: 'Level 2: Medium',
    color: 'amber',
    icon: '⚡',
  },
  3: {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    border: 'border-rose-300 dark:border-rose-800',
    text: 'text-rose-700 dark:text-rose-200',
    badgeBg: 'bg-rose-500',
    label: 'Level 3: Hard',
    color: 'rose',
    icon: '🔥',
  },
};

export default function AdaptiveQuizPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  // Mode: 'interactive' (dynamic question-by-question) or 'batch' (standard full test)
  const [mode, setMode] = useState('interactive');

  // Shared state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Interactive Mode State ──
  const [interactiveData, setInteractiveData] = useState(null);
  const [currentQ, setCurrentQ] = useState(null);
  const [selectedChoiceId, setSelectedChoiceId] = useState(null);
  const [submittingStep, setSubmittingStep] = useState(false);
  const [stepFeedback, setStepFeedback] = useState(null); // stores answer feedback before moving to next
  const [sessionHistory, setSessionHistory] = useState([]);
  const [finalResult, setFinalResult] = useState(null);

  // ── Batch Mode State ──
  const [batchQuiz, setBatchQuiz] = useState(null);
  const [batchAnswers, setBatchAnswers] = useState({});
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [batchResult, setBatchResult] = useState(null);

  useEffect(() => {
    initQuiz();
  }, [quizId, mode]);

  const initQuiz = async () => {
    setLoading(true);
    setError('');
    setStepFeedback(null);
    setFinalResult(null);
    setBatchResult(null);

    try {
      if (mode === 'interactive') {
        const res = await startInteractiveAdaptiveQuiz(quizId);
        setInteractiveData(res.data);
        setCurrentQ(res.data.question);
        setSessionHistory([]);
        setSelectedChoiceId(null);
      } else {
        const res = await getAdaptiveQuiz(quizId);
        setBatchQuiz(res.data);
        setBatchAnswers({});
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to initialize adaptive quiz.');
    } finally {
      setLoading(false);
    }
  };

  // ── Interactive Handler: Submit current question ──
  const handleInteractiveAnswer = async () => {
    if (!selectedChoiceId) {
      setError('Please select an option first.');
      return;
    }
    setError('');
    setSubmittingStep(true);

    try {
      const payload = {
        question_id: currentQ.id,
        choice_id: selectedChoiceId,
        session_history: sessionHistory,
      };
      const res = await submitInteractiveAnswer(quizId, payload);
      const data = res.data;

      // Show instant feedback on screen
      setStepFeedback(data);

      if (data.is_completed) {
        setFinalResult(data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit answer.');
    } finally {
      setSubmittingStep(false);
    }
  };

  // ── Interactive Handler: Move to Next Question ──
  const handleProceedToNext = () => {
    if (!stepFeedback) return;

    if (stepFeedback.is_completed) {
      setFinalResult(stepFeedback);
      setStepFeedback(null);
      return;
    }

    setInteractiveData((prev) => ({
      ...prev,
      current_level: stepFeedback.new_level,
      level_display: stepFeedback.level_display,
      consecutive_correct: stepFeedback.consecutive_correct,
      consecutive_wrong: stepFeedback.consecutive_wrong,
      question_number: stepFeedback.question_number,
    }));

    setSessionHistory(stepFeedback.session_history || []);
    setCurrentQ(stepFeedback.next_question);
    setSelectedChoiceId(null);
    setStepFeedback(null);
  };

  // ── Batch Handler: Submit full quiz ──
  const handleBatchSubmit = async () => {
    const answersArray = Object.entries(batchAnswers).map(([qId, cId]) => ({
      question_id: parseInt(qId),
      choice_id: cId,
    }));
    if (answersArray.length !== batchQuiz.questions.length) {
      setError('Please answer all questions before submitting.');
      return;
    }
    setBatchSubmitting(true);
    setError('');
    try {
      const res = await submitAdaptiveQuiz(quizId, answersArray);
      setBatchResult(res.data);
    } catch {
      setError('Failed to submit batch quiz.');
    } finally {
      setBatchSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium text-sm">Calibrating adaptive difficulty...</p>
        </div>
      </DashboardLayout>
    );
  }

  const currentLevel = mode === 'interactive'
    ? interactiveData?.current_level || 1
    : batchQuiz?.current_level || 1;
  const currentLvlCfg = LEVEL_CONFIG[currentLevel] || LEVEL_CONFIG[1];

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <BackLink to="/student" label="Back to Courses" />

        {/* ── Page Header & Adaptive Badge ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-800 dark:text-indigo-300 border border-brand-200 dark:border-brand-800">
                  🧠 Adaptive Engine
                </span>
                <span className="text-xs text-gray-400 dark:text-slate-400">Rule: 3 Correct ➜ Level Up | 2 Wrong ➜ Level Down</span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                {interactiveData?.quiz_title || batchQuiz?.quiz_title || 'Adaptive Quiz'}
              </h2>
            </div>

            {/* Mode Switcher */}
            <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold border border-transparent dark:border-slate-700">
              <button
                type="button"
                onClick={() => setMode('interactive')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  mode === 'interactive' ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                ⚡ Live Adaptive
              </button>
              <button
                type="button"
                onClick={() => setMode('batch')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  mode === 'batch' ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                📋 Standard Set
              </button>
            </div>
          </div>

          {/* ── Difficulty Meter ── */}
          <div className="bg-gray-50 dark:bg-slate-800/60 rounded-xl p-4 border border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wide">
                Active Difficulty Level
              </span>
              <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${currentLvlCfg.bg} ${currentLvlCfg.text} border ${currentLvlCfg.border}`}>
                {currentLvlCfg.icon} {currentLvlCfg.label}
              </span>
            </div>

            {/* Visual Level Bars */}
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((lvl) => {
                const cfg = LEVEL_CONFIG[lvl];
                const isActive = lvl === currentLevel;
                const isPast = lvl < currentLevel;
                return (
                  <div
                    key={lvl}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      isActive
                        ? `${cfg.badgeBg} ring-2 ring-offset-1 ring-brand-400`
                        : isPast
                        ? 'bg-gray-300 dark:bg-slate-700'
                        : 'bg-gray-200 dark:bg-slate-800 opacity-60'
                    }`}
                  />
                );
              })}
            </div>

            {mode === 'interactive' && interactiveData && (
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 mt-2.5">
                <span>
                  🔥 Streak: <strong className="text-gray-800 dark:text-white">{interactiveData.consecutive_correct}/3</strong> correct in a row
                </span>
                <span>
                  ⚠️ Consecutive misses: <strong className="text-gray-800 dark:text-white">{interactiveData.consecutive_wrong}/2</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-200 text-sm font-semibold rounded-xl p-4 mb-6">
            {error}
          </div>
        )}

        {/* ══════════════════════════════════════════
            MODE 1: INTERACTIVE QUESTION-BY-QUESTION
        ══════════════════════════════════════════ */}
        {mode === 'interactive' && !finalResult && currentQ && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 md:p-8">
            {/* Question Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-indigo-300 font-black text-sm flex items-center justify-center">
                  Q{interactiveData.question_number || 1}
                </span>
                <span className="text-xs font-semibold text-gray-400 dark:text-slate-400">
                  of {interactiveData.total_questions || 6}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {currentQ.topic_name && (
                  <span className="text-xs font-semibold bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-indigo-300 px-2.5 py-1 rounded-full border border-brand-100 dark:border-brand-800">
                    🏷️ {currentQ.topic_name}
                  </span>
                )}
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${currentLvlCfg.bg} ${currentLvlCfg.text} border ${currentLvlCfg.border}`}>
                  {currentQ.difficulty_display || currentLvlCfg.label}
                </span>
              </div>
            </div>

            {/* Question Text Box - High-Contrast & Clear */}
            <div className="mb-6 bg-indigo-50/90 dark:bg-slate-800/90 border-2 border-indigo-300 dark:border-indigo-500/50 rounded-2xl p-5 md:p-6 shadow-xs border-l-8 border-l-indigo-600 dark:border-l-indigo-400">
              <h3 className="text-lg md:text-xl font-black text-slate-950 dark:text-white leading-relaxed">
                {currentQ.text}
              </h3>
            </div>

            {/* Choices */}
            <div className="space-y-3 mb-6">
              {currentQ.choices?.map((choice, cIdx) => {
                const isSelected = selectedChoiceId === choice.id;
                const optionLetter = String.fromCharCode(65 + cIdx);
                return (
                  <label
                    key={choice.id}
                    className={`flex items-center gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50/90 dark:bg-indigo-950/70 shadow-sm ring-2 ring-indigo-500/20 text-slate-950 dark:text-white font-semibold'
                        : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium'
                    } ${stepFeedback ? 'pointer-events-none' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                    }`}>
                      {optionLetter}
                    </div>
                    <input
                      type="radio"
                      name={`interactive-q-${currentQ.id}`}
                      checked={isSelected}
                      onChange={() => setSelectedChoiceId(choice.id)}
                      disabled={!!stepFeedback}
                      className="sr-only"
                    />
                    <span className="text-sm md:text-base font-semibold leading-snug">
                      {choice.text}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* ── Step Feedback Banner (Shown immediately after submitting answer) ── */}
            {stepFeedback && (
              <div
                className={`rounded-2xl p-5 mb-6 border ${
                  stepFeedback.is_correct
                    ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-200 dark:border-brand-800 text-brand-900 dark:text-indigo-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">
                    {stepFeedback.is_correct ? '🎉' : '❌'}
                  </span>
                  <div className="flex-1">
                    <p className="font-extrabold text-base">
                      {stepFeedback.is_correct
                        ? 'Correct Answer!'
                        : 'Incorrect Answer'}
                    </p>
                    {!stepFeedback.is_correct && (
                      <p className="text-sm mt-1 text-rose-700 dark:text-rose-300">
                        The correct answer was: <strong>{stepFeedback.correct_choice}</strong>.
                        <br />
                        <span className="text-xs text-rose-600 dark:text-rose-400 italic">
                          This question has been scheduled into your Spaced Repetition queue for tomorrow!
                        </span>
                      </p>
                    )}

                    {/* Level Change Notification */}
                    {stepFeedback.level_changed && (
                      <div
                        className={`mt-3 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                          stepFeedback.change_direction === 'up'
                            ? 'bg-brand-200/60 dark:bg-brand-900/60 text-brand-950 dark:text-white'
                            : 'bg-amber-200/60 dark:bg-amber-900/60 text-amber-950 dark:text-amber-200'
                        }`}
                      >
                        {stepFeedback.change_direction === 'up' ? (
                          <>🚀 Level Up! 3 in a row! Difficulty increased to Level {stepFeedback.new_level}: {stepFeedback.level_display}</>
                        ) : (
                          <>📉 Difficulty adjusted to Level {stepFeedback.new_level}: {stepFeedback.level_display} to reinforce concepts.</>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!stepFeedback ? (
              <button
                type="button"
                onClick={handleInteractiveAnswer}
                disabled={submittingStep || !selectedChoiceId}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl disabled:opacity-40 transition-all shadow-md text-sm md:text-base cursor-pointer"
              >
                {submittingStep ? 'Evaluating...' : 'Check Answer & Adapt Difficulty ➔'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleProceedToNext}
                className="w-full bg-brand-700 hover:bg-brand-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-md text-sm md:text-base cursor-pointer"
              >
                {stepFeedback.is_completed ? 'View Final Results 🏆' : 'Next Question ➔'}
              </button>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            INTERACTIVE FINAL RESULTS SCREEN
        ══════════════════════════════════════════ */}
        {mode === 'interactive' && finalResult && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-8 text-center">
              <div
                className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl ${
                  finalResult.passed ? 'bg-brand-50 dark:bg-brand-900/40 text-brand-600' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-500'
                }`}
              >
                {finalResult.passed ? '🏆' : '📘'}
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1">
                Adaptive Quiz Completed!
              </h3>
              <p
                className={`text-5xl font-black my-3 ${
                  finalResult.passed ? 'text-brand-600 dark:text-brand-300' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {finalResult.percentage}%
              </p>
              <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">
                Score: {finalResult.score} / {finalResult.total_marks} marks —{' '}
                <strong className={finalResult.passed ? 'text-brand-600 dark:text-brand-300' : 'text-rose-600 dark:text-rose-400'}>
                  {finalResult.passed ? 'Passed ✓' : 'Not Passed'}
                </strong>
              </p>

              {/* Final Difficulty Status */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-indigo-300 border border-brand-200 dark:border-brand-800 text-sm font-bold">
                <span>Final Calibrated Level:</span>
                <span className="bg-brand-600 text-white px-2 py-0.5 rounded-full text-xs">
                  Level {finalResult.new_level}: {finalResult.level_display}
                </span>
              </div>
            </div>

            {/* Answer Breakdown */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Session Breakdown</h4>
              <div className="space-y-3">
                {finalResult.results?.map((r, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-xl border ${
                      r.is_correct
                        ? 'bg-brand-50/60 dark:bg-slate-800/50 border-brand-200 dark:border-slate-700'
                        : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                    }`}
                  >
                    <p className="font-extrabold text-slate-950 dark:text-white text-sm mb-1">
                      {i + 1}. {r.question_text}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      Your answer: <strong>{r.selected_choice}</strong> {r.is_correct ? '✓' : '✗'}
                    </p>
                    {!r.is_correct && r.correct_choice && (
                      <p className="text-xs text-rose-700 dark:text-rose-300 font-bold mt-1">
                        Correct: <strong>{r.correct_choice}</strong> (sent to Spaced Review)
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => initQuiz()}
                className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition cursor-pointer"
              >
                🔄 Retake Adaptive Quiz
              </button>
              <button
                type="button"
                onClick={() => navigate('/student/topic-strengths')}
                className="flex-1 bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-indigo-300 border border-brand-200 dark:border-brand-800 font-bold py-3 rounded-xl hover:bg-brand-100 dark:hover:bg-brand-900/60 transition cursor-pointer"
              >
                📊 View Topic Strengths
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            MODE 2: BATCH QUIZ (STANDARD SET)
        ══════════════════════════════════════════ */}
        {mode === 'batch' && !batchResult && batchQuiz && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 md:p-8">
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">
              This set is tuned to your level ({batchQuiz.level_display}). Answer all questions and submit to update your rating.
            </p>

            <div className="space-y-8">
              {batchQuiz.questions?.map((q, idx) => (
                <div key={q.id} className="pb-6 border-b border-gray-100 dark:border-slate-800 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    {q.topic_name && (
                      <span className="text-xs font-medium text-gray-400 dark:text-slate-400">
                        [{q.topic_name}]
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-gray-900 dark:text-white mb-3">{q.text}</p>
                  <div className="space-y-2 ml-4">
                    {q.choices?.map((c) => (
                      <label
                        key={c.id}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                          batchAnswers[q.id] === c.id
                            ? 'border-brand-600 bg-brand-50/70 dark:bg-brand-900/40 text-gray-900 dark:text-white'
                            : 'border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-800 dark:text-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`batch-q-${q.id}`}
                          checked={batchAnswers[q.id] === c.id}
                          onChange={() => setBatchAnswers({ ...batchAnswers, [q.id]: c.id })}
                          className="accent-brand-600"
                        />
                        <span className="text-sm">{c.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleBatchSubmit}
              disabled={batchSubmitting}
              className="w-full mt-8 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl disabled:opacity-50 transition cursor-pointer"
            >
              {batchSubmitting ? 'Evaluating...' : 'Submit Full Adaptive Quiz'}
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════
            BATCH RESULTS SCREEN
        ══════════════════════════════════════════ */}
        {mode === 'batch' && batchResult && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-8 text-center">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Results</h3>
              <p className="text-5xl font-black text-brand-600 dark:text-brand-300 mb-2">{batchResult.percentage}%</p>
              <p className="text-gray-500 dark:text-slate-400 mb-4">{batchResult.score}/{batchResult.total_marks} marks</p>
              <span className="px-3 py-1 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-indigo-300 rounded-full font-bold text-sm border border-brand-200 dark:border-brand-800">
                Next Level: {batchResult.level_display}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => initQuiz()}
                className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition cursor-pointer"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => navigate('/student/topic-strengths')}
                className="flex-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-transparent dark:border-slate-700 font-bold py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-750 transition cursor-pointer"
              >
                Topic Strengths
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
