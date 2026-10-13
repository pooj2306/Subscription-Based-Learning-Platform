import { useEffect, useState } from 'react';
import {
  getDueCards,
  getAllCards,
  submitSpacedReview,
  simulateSpacedDays,
} from '../../api/adaptiveApi';
import DashboardLayout from '../../components/DashboardLayout';
import BackLink from '../../components/BackLink';

const INTERVAL_STEPS = [
  { days: 1, label: '1 Day' },
  { days: 3, label: '3 Days' },
  { days: 7, label: '7 Days' },
  { days: 14, label: '14 Days' },
  { days: 30, label: 'Mastered' },
];

export default function SpacedRepetitionPage() {
  const [dueData, setDueData] = useState(null);
  const [allData, setAllData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('due'); // 'due' | 'all'

  // Review Mode
  const [reviewMode, setReviewMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [reviewResults, setReviewResults] = useState(null);

  // Time Simulation Tool
  const [simulating, setSimulating] = useState(false);
  const [simMessage, setSimMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dueRes, allRes] = await Promise.all([getDueCards(), getAllCards()]);
      setDueData(dueRes.data);
      setAllData(allRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartReview = () => {
    setReviewMode(true);
    setCurrentCardIndex(0);
    setAnswers({});
    setReviewResults(null);
  };

  const handleSelectChoice = (cardId, choiceId) => {
    setAnswers((prev) => ({ ...prev, [cardId]: choiceId }));
  };

  const handleNextCard = () => {
    if (currentCardIndex < (dueData?.cards?.length || 0) - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    }
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex((prev) => prev - 1);
    }
  };

  const handleSubmitReview = async () => {
    const answersArray = Object.entries(answers).map(([cardId, choiceId]) => ({
      card_id: parseInt(cardId),
      choice_id: choiceId,
    }));

    if (answersArray.length === 0) {
      alert('Please answer at least one card.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitSpacedReview(answersArray);
      setReviewResults(res.data);
      setReviewMode(false);
      // Reload updated cards
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulateDays = async (days) => {
    setSimulating(true);
    setSimMessage('');
    try {
      const res = await simulateSpacedDays(days);
      setSimMessage(`⚡ Advanced schedule forward by ${days} day(s). ${res.data.cards_now_due} card(s) are now due!`);
      loadData();
    } catch (err) {
      console.error(err);
      setSimMessage('Failed to simulate days.');
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium text-sm">Loading spaced review queue...</p>
        </div>
      </DashboardLayout>
    );
  }

  const currentCard = dueData?.cards?.[currentCardIndex];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto pb-12">
        <BackLink to="/student" label="Back to Dashboard" />

        {/* ── Spaced Repetition Header ── */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-7 md:p-8 border border-gray-100 dark:border-slate-800 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2 border border-brand-200 dark:border-brand-800">
                <span>🔁</span> Anki Spaced Repetition Engine
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                Spaced Review Memory Retention
              </h2>
            </div>

            {/* Schedule Stage Indicator */}
            <div className="flex items-center gap-1 bg-gray-50 dark:bg-slate-800/60 p-2 rounded-2xl border border-gray-100 dark:border-slate-800">
              <span className="text-xs font-bold text-gray-500 dark:text-slate-400 mr-2">Intervals:</span>
              {['1d', '3d', '7d', '14d', '30d (Mastered)'].map((intvl, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-[11px] font-bold text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 shadow-2xs"
                >
                  {intvl}
                </span>
              ))}
            </div>
          </div>

          <p className="text-gray-600 dark:text-slate-400 text-sm md:text-base leading-relaxed">
            Whenever you answer a question incorrectly, it automatically enters your spaced repetition queue.
            Cards resurface at expanding intervals (<strong>1 day ➜ 3 days ➜ 7 days ➜ 14 days ➜ 30 days</strong>)
            until fully mastered.
          </p>

          {/* ── Live Fast-Forward Testing Tool ── */}
          <div className="mt-5 pt-5 border-t border-gray-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-brand-50/50 dark:bg-brand-950/20 p-4 rounded-2xl border border-brand-100 dark:border-brand-800/40">
            <div>
              <p className="text-xs font-bold text-brand-900 dark:text-indigo-300 flex items-center gap-1">
                <span>⏱️</span> Schedule Simulator (Testing Tool)
              </p>
              <p className="text-[11px] text-brand-700 dark:text-slate-400">
                Simulate time passing to test the 1, 3, and 7-day resurfacing cycles without waiting real days.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {[1, 3, 7].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleSimulateDays(d)}
                  disabled={simulating}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-brand-600 hover:text-white dark:hover:bg-brand-600 text-brand-900 dark:text-indigo-200 text-xs font-bold rounded-xl border border-brand-200 dark:border-slate-700 shadow-2xs transition disabled:opacity-50 cursor-pointer"
                >
                  +{d} Day{d > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>
          {simMessage && (
            <p className="text-xs font-bold text-brand-700 dark:text-white bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 p-2.5 rounded-xl mt-3">
              {simMessage}
            </p>
          )}
        </div>

        {/* ── Metric Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Due for Review', value: dueData?.due_count || 0, icon: '🔔', color: 'rose', bg: 'bg-rose-50', text: 'text-rose-600 dark:text-rose-400' },
            { label: 'Active in Queue', value: allData?.active || 0, icon: '📚', color: 'amber', bg: 'bg-amber-50', text: 'text-amber-600 dark:text-amber-400' },
            { label: 'Mastered Cards', value: allData?.retired || 0, icon: '🎉', color: 'emerald', bg: 'bg-emerald-50', text: 'text-brand-600 dark:text-brand-300' },
            { label: 'Total Cards', value: allData?.total || 0, icon: '📋', color: 'blue', bg: 'bg-blue-50', text: 'text-brand-700 dark:text-indigo-400' },
          ].map((m) => (
            <div
              key={m.label}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm text-center"
            >
              <span className="text-2xl mb-1 block">{m.icon}</span>
              <p className={`text-3xl font-black ${m.text}`}>{m.value}</p>
              <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mt-1">{m.label}</p>
            </div>
          ))}
        </div>

        {/* ── Results Banner After Session ── */}
        {reviewResults && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-indigo-200 dark:border-indigo-800 shadow-md mb-6">
            <h3 className="font-black text-gray-900 dark:text-white text-lg mb-4 flex items-center gap-2">
              <span>🎉</span> Review Session Completed
            </h3>
            <div className="space-y-2.5">
              {reviewResults.results?.map((r, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl text-xs md:text-sm flex flex-col md:flex-row md:items-center justify-between gap-3 border ${
                    r.is_correct
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-950 dark:text-rose-100'
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-extrabold text-slate-900 dark:text-white text-sm mb-1">
                      {i + 1}. {r.question_text || `Card #${r.card_id}`}
                    </p>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      Result: {r.is_correct ? '✓ Correct' : `✗ Incorrect (Correct: ${r.correct_choice})`}
                    </p>
                  </div>
                  <span className="font-bold px-3 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 shrink-0 self-start md:self-auto">
                    {r.is_retired ? '🏆 Mastered!' : `Next Review: ${r.next_review_date}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tabs: Due Today vs All Cards ── */}
        <div className="flex bg-gray-100 dark:bg-slate-900 p-1.5 rounded-2xl mb-6 border border-transparent dark:border-slate-800">
          <button
            type="button"
            onClick={() => { setTab('due'); setReviewMode(false); }}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition cursor-pointer ${
              tab === 'due' ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            🔔 Due for Review ({dueData?.due_count || 0})
          </button>
          <button
            type="button"
            onClick={() => { setTab('all'); setReviewMode(false); }}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition cursor-pointer ${
              tab === 'all' ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            🗂️ All Review Cards ({allData?.total || 0})
          </button>
        </div>

        {/* ══════════════════════════════════════════
            TAB 1: DUE CARDS / REVIEW MODE
        ══════════════════════════════════════════ */}
        {tab === 'due' && !reviewMode && (
          <div>
            {!dueData || dueData.due_count === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-gray-100 dark:border-slate-800 shadow-sm">
                <span className="text-6xl block mb-3">🎉</span>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1">
                  All Caught Up for Today!
                </h3>
                <p className="text-gray-500 dark:text-slate-400 text-sm max-w-md mx-auto mb-6">
                  You have no pending review cards scheduled for today. Check back tomorrow, or use the Simulator above to test future reviews.
                </p>
                {allData && allData.active > 0 && (
                  <button
                    type="button"
                    onClick={() => handleSimulateDays(1)}
                    className="bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-indigo-300 font-bold px-5 py-2.5 rounded-xl text-xs hover:bg-brand-100 dark:hover:bg-brand-900/50 transition cursor-pointer"
                  >
                    ⚡ Fast-forward 1 Day to test reviews
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-10 text-center border border-gray-100 dark:border-slate-800 shadow-sm">
                <span className="text-5xl block mb-3">🔔</span>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                  {dueData.due_count} Card{dueData.due_count > 1 ? 's' : ''} Due for Review
                </h3>
                <p className="text-gray-500 dark:text-slate-400 text-sm max-w-md mx-auto mb-6">
                  Reinforce your memory with these flashcard reviews. Getting them right advances them to the next interval!
                </p>
                <button
                  type="button"
                  onClick={handleStartReview}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold px-8 py-4 rounded-2xl shadow-lg shadow-brand-900/20 text-base transition cursor-pointer"
                >
                  🚀 Start Spaced Review Session
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            INTERACTIVE REVIEW FLASHCARD MODE
        ══════════════════════════════════════════ */}
        {tab === 'due' && reviewMode && currentCard && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border-2 border-indigo-200 dark:border-indigo-900/80 shadow-xl">
            {/* Review Progress */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 uppercase tracking-wide border border-indigo-200 dark:border-indigo-800">
                  Card {currentCardIndex + 1} of {dueData.cards.length}
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Stage {currentCard.interval_index + 1}: {INTERVAL_STEPS[currentCard.interval_index]?.label || 'Review'}
                </span>
              </div>
              <div className="flex gap-1.5">
                {dueData.cards.map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all ${
                      i === currentCardIndex
                        ? 'bg-indigo-600 scale-125 ring-2 ring-indigo-400/40'
                        : answers[dueData.cards[i].id]
                        ? 'bg-emerald-500'
                        : 'bg-gray-200 dark:bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Question Text Box - Ultra High Visibility & Vivid Colors */}
            <div className="mb-6 bg-indigo-50/90 dark:bg-slate-800/90 border-2 border-indigo-300 dark:border-indigo-500/50 rounded-2xl p-5 md:p-6 shadow-sm border-l-8 border-l-indigo-600 dark:border-l-indigo-400">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs font-black px-3 py-1 rounded-full bg-indigo-600 text-white uppercase tracking-wider shadow-xs">
                  📝 Spaced Review Question
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Stage {currentCard.interval_index + 1}: {INTERVAL_STEPS[currentCard.interval_index]?.label || 'Review'}
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-slate-950 dark:text-white leading-relaxed tracking-tight">
                {currentCard.question_detail?.text || 'Question'}
              </h3>
            </div>

            {/* Choices with High Contrast and A/B/C/D Badges */}
            <div className="space-y-3 mb-8">
              {currentCard.question_detail?.choices?.map((c, cIdx) => {
                const isSelected = answers[currentCard.id] === c.id;
                const optionLetter = String.fromCharCode(65 + cIdx);
                return (
                  <label
                    key={c.id}
                    className={`flex items-center gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition ${
                      isSelected
                        ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50/90 dark:bg-indigo-950/70 font-semibold shadow-md ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
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
                      name={`card-choice-${currentCard.id}`}
                      checked={isSelected}
                      onChange={() => handleSelectChoice(currentCard.id, c.id)}
                      className="sr-only"
                    />
                    <span className="text-sm md:text-base font-semibold text-slate-900 dark:text-white leading-snug">
                      {c.text}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handlePrevCard}
                disabled={currentCardIndex === 0}
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 font-bold text-xs hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-30 transition cursor-pointer"
              >
                ← Previous
              </button>

              {currentCardIndex < dueData.cards.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNextCard}
                  className="px-6 py-2.5 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-indigo-300 font-bold text-xs hover:bg-brand-100 dark:hover:bg-brand-900/50 transition cursor-pointer"
                >
                  Next Card →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={submitting || !answers[currentCard.id]}
                  className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs disabled:opacity-50 transition shadow-md cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Finish & Record Reviews ✓'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB 2: ALL REVIEW CARDS
        ══════════════════════════════════════════ */}
        {tab === 'all' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-gray-900 dark:text-white text-xl">
                All Retention Cards ({allData?.total || 0})
              </h3>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Generated retention queue
              </span>
            </div>

            {(!allData || allData.cards?.length === 0) ? (
              <p className="text-gray-400 dark:text-slate-400 text-center py-8">
                No cards in your library yet. Take quizzes and miss questions to create review cards.
              </p>
            ) : (
              <div className="space-y-3">
                {allData.cards.map((card, idx) => {
                  const isDue = card.is_due;
                  const isRetired = card.is_retired;
                  return (
                    <div
                      key={card.id}
                      className="p-4 md:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-600 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            Card #{idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            Interval #{card.interval_index + 1} ({INTERVAL_STEPS[card.interval_index]?.label || 'Scheduled'})
                          </span>
                        </div>
                        <p className="font-bold text-slate-950 dark:text-white text-base leading-snug">
                          {card.question_detail?.text || `Question #${card.question}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-bold">
                          {isRetired
                            ? 'Mastered'
                            : isDue
                            ? 'Due Today'
                            : `In ${card.days_until_review}d (${card.next_review_date})`}
                        </span>
                        <span
                          className={`text-xs font-black px-3.5 py-1.5 rounded-full ${
                            isRetired
                              ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                              : isDue
                              ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800 animate-pulse'
                              : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                          }`}
                        >
                          {isRetired ? '✅ Mastered' : isDue ? '🔔 Due' : '⏳ Scheduled'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
