import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getTopicStrengths,
  getWeakTopicPractice,
  submitWeakTopicPractice,
} from '../../api/adaptiveApi';
import DashboardLayout from '../../components/DashboardLayout';
import BackLink from '../../components/BackLink';

const STRENGTH_CONFIG = {
  strong: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    barColor: 'bg-emerald-500',
    icon: '💪',
    label: 'Strong',
  },
  average: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    barColor: 'bg-amber-500',
    icon: '📊',
    label: 'Average',
  },
  weak: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    barColor: 'bg-rose-500',
    icon: '🎯',
    label: 'Weak',
  },
};

export default function TopicStrengthsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Practice Quiz State
  const [practiceQuiz, setPracticeQuiz] = useState(null);
  const [loadingPractice, setLoadingPractice] = useState(false);
  const [practiceAnswers, setPracticeAnswers] = useState({});
  const [submittingPractice, setSubmittingPractice] = useState(false);
  const [practiceResult, setPracticeResult] = useState(null);

  useEffect(() => {
    fetchStrengths();
  }, []);

  const fetchStrengths = () => {
    setLoading(true);
    getTopicStrengths()
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleGeneratePractice = async () => {
    setLoadingPractice(true);
    setPracticeResult(null);
    setPracticeAnswers({});
    try {
      const res = await getWeakTopicPractice();
      setPracticeQuiz(res.data);
      // Scroll to practice section
      setTimeout(() => {
        document.getElementById('practice-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPractice(false);
    }
  };

  const handleSelectPracticeAnswer = (qId, cId) => {
    setPracticeAnswers((prev) => ({ ...prev, [qId]: cId }));
  };

  const handleSubmitPractice = async () => {
    const answersArray = Object.entries(practiceAnswers).map(([qId, cId]) => ({
      question_id: parseInt(qId),
      choice_id: cId,
    }));

    if (answersArray.length === 0) {
      alert('Please answer at least one question before submitting.');
      return;
    }

    setSubmittingPractice(true);
    try {
      const res = await submitWeakTopicPractice(answersArray);
      setPracticeResult(res.data);

      // Refresh topic metrics so the student sees their mastery increase!
      getTopicStrengths().then((refreshed) => setData(refreshed.data));
    } catch (err) {
      console.error(err);
      alert('Failed to submit practice quiz.');
    } finally {
      setSubmittingPractice(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium text-sm">Analyzing topic performance...</p>
        </div>
      </DashboardLayout>
    );
  }

  const { summary, topics, headline, recommendation, weak_topics } = data || {
    summary: {},
    topics: [],
    headline: '',
    recommendation: '',
    weak_topics: [],
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto pb-12">
        <BackLink to="/student" label="Back to Dashboard" />

        {/* ── Signature Performance Insight Banner ── */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-7 md:p-8 shadow-xl mb-8 relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-bold uppercase tracking-wider mb-3 border border-indigo-400/30">
              <span>🧠</span> Weak-Topic Diagnostics
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
              {headline || "Topic Strengths & Performance"}
            </h2>

            <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-2xl mb-6">
              {recommendation || "Here is a breakdown of your knowledge areas. Target weak topics to accelerate your mastery."}
            </p>

            <button
              type="button"
              onClick={handleGeneratePractice}
              disabled={loadingPractice}
              className="bg-white hover:bg-slate-100 text-slate-950 font-black px-6 py-3.5 rounded-2xl shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 text-sm md:text-base cursor-pointer"
            >
              <span>🎯</span>
              {loadingPractice ? 'Generating Practice...' : 'Auto-Generate Practice Quiz from Weak Topics'}
            </button>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { key: 'strong', label: 'Strong Topics', count: summary?.strong || 0, color: 'brand', icon: '💪' },
            { key: 'average', label: 'Average Topics', count: summary?.average || 0, color: 'amber', icon: '📊' },
            { key: 'weak', label: 'Weak Topics', count: summary?.weak || 0, color: 'rose', icon: '🎯' },
          ].map((item) => (
            <div
              key={item.key}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-card-border dark:border-slate-800 shadow-xs text-center transition-all hover:shadow-md"
            >
              <span className="text-2xl md:text-3xl mb-1 block">{item.icon}</span>
              <p className={`text-3xl font-black ${item.color === 'brand' ? 'text-brand-600 dark:text-indigo-400' : item.color === 'amber' ? 'text-amber-600 dark:text-amber-300' : 'text-rose-600 dark:text-rose-300'}`}>
                {item.count}
              </p>
              <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mt-1">{item.label}</p>
            </div>
          ))}
        </div>

        {/* ── Topic Mastery List ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-card-border dark:border-slate-800 overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-extrabold text-gray-900 dark:text-white text-lg">Topic Breakdown</h3>
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">{topics.length} tracked topics</span>
          </div>

          {topics.length === 0 ? (
            <div className="p-12 text-center">
              <span className="text-5xl block mb-3">📝</span>
              <h4 className="font-bold text-gray-800 dark:text-white text-lg mb-1">No Quiz Attempts Yet</h4>
              <p className="text-gray-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
                Take an adaptive quiz to allow the system to evaluate your strengths and weaknesses.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {topics.map((t) => {
                const cfg = STRENGTH_CONFIG[t.strength_label] || STRENGTH_CONFIG.average;
                return (
                  <div key={t.id} className="p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl ${cfg.bg} border ${cfg.border} flex items-center justify-center text-xl shrink-0`}>
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-bold text-gray-900 dark:text-white text-base truncate">{t.topic_name}</h4>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                            {cfg.label}
                          </span>
                          {t.elo_rating && (
                            <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              ⚡ {t.elo_rating} Elo ({t.elo_tier})
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          {t.total_correct} / {t.total_attempted} answers correct
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar & Percentage */}
                    <div className="flex items-center gap-4 md:w-64">
                      <div className="flex-1 h-3 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${cfg.barColor}`}
                          style={{ width: `${Math.min(t.accuracy, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-black text-gray-800 dark:text-white w-12 text-right">
                        {t.accuracy}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════
            AUTO-GENERATED PRACTICE QUIZ SECTION
        ══════════════════════════════════════════════════ */}
        <div id="practice-section">
          {practiceQuiz && practiceQuiz.questions?.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-md border-2 border-brand-200 dark:border-slate-700 p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-slate-800">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-1">
                    <span>🎯</span> Targeted Practice Session
                  </div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">
                    Practice: Weak Areas
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    {practiceQuiz.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setPracticeQuiz(null); setPracticeResult(null); }}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white font-semibold cursor-pointer"
                >
                  Close Practice ✕
                </button>
              </div>

              {/* Questions List */}
              <div className="space-y-6 mb-8">
                {practiceQuiz.questions.map((q, idx) => (
                  <div key={q.id} className="p-6 md:p-7 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-900/60 shadow-md">
                    {/* High-Contrast Question Box */}
                    <div className="mb-5 bg-indigo-50/90 dark:bg-slate-800/90 border-2 border-indigo-300 dark:border-indigo-500/50 rounded-2xl p-5 shadow-xs border-l-8 border-l-indigo-600 dark:border-l-indigo-400">
                      <div className="flex flex-wrap items-center gap-2 mb-2.5">
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white uppercase tracking-wider">
                          Question {idx + 1}
                        </span>
                        {q.topic_name && (
                          <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                            🏷️ {q.topic_name}
                          </span>
                        )}
                      </div>
                      <p className="font-black text-slate-950 dark:text-white text-lg md:text-xl leading-relaxed">
                        {q.text}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {q.choices?.map((c, cIdx) => {
                        const isSelected = practiceAnswers[q.id] === c.id;
                        const optionLetter = String.fromCharCode(65 + cIdx);
                        return (
                          <label
                            key={c.id}
                            className={`flex items-center gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition ${
                              isSelected
                                ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50/90 dark:bg-indigo-950/70 font-semibold shadow-sm ring-2 ring-indigo-500/20'
                                : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800'
                            } ${practiceResult ? 'pointer-events-none' : ''}`}
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
                              name={`practice-q-${q.id}`}
                              checked={isSelected}
                              onChange={() => handleSelectPracticeAnswer(q.id, c.id)}
                              disabled={!!practiceResult}
                              className="sr-only"
                            />
                            <span className="text-sm md:text-base font-semibold text-slate-900 dark:text-white leading-snug">
                              {c.text}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Practice Results Breakdown */}
              {practiceResult && (
                <div className="bg-indigo-50/50 dark:bg-slate-950/50 rounded-2xl p-6 border border-indigo-200 dark:border-slate-700 mb-6">
                  <div className="text-center mb-4">
                    <span className="text-3xl block mb-1">🎉</span>
                    <h4 className="text-xl font-black text-gray-900 dark:text-white">
                      Practice Complete!
                    </h4>
                    <p className="text-3xl font-black text-brand-600 dark:text-white my-1">
                      {practiceResult.percentage}%
                    </p>
                    <p className="text-sm text-gray-900 dark:text-slate-200 font-semibold">
                      {practiceResult.message}
                    </p>
                  </div>

                  <div className="space-y-2.5 max-h-72 overflow-y-auto">
                    {practiceResult.results?.map((r, i) => (
                      <div
                        key={i}
                        className={`p-4 rounded-xl text-xs md:text-sm flex flex-col md:flex-row md:items-center justify-between gap-2 border ${
                          r.is_correct
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
                            : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-900 text-rose-950 dark:text-rose-100'
                        }`}
                      >
                        <span className="font-black text-slate-900 dark:text-white">
                          {i + 1}. {r.question_text}
                        </span>
                        <span className="font-extrabold shrink-0 px-2.5 py-1 rounded-md bg-white/80 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700">
                          {r.is_correct ? '✓ Correct' : `✗ Correct was: ${r.correct_choice}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              {!practiceResult ? (
                <button
                  type="button"
                  onClick={handleSubmitPractice}
                  disabled={submittingPractice}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-extrabold py-4 rounded-2xl disabled:opacity-50 transition shadow-lg shadow-brand-600/20 text-base cursor-pointer"
                >
                  {submittingPractice ? 'Grading & Updating Mastery...' : 'Submit Practice Quiz ➔'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGeneratePractice}
                  className="w-full bg-brand-700 hover:bg-brand-800 text-white font-bold py-3.5 rounded-2xl transition shadow-md text-sm cursor-pointer"
                >
                  🔄 Practice Again
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
