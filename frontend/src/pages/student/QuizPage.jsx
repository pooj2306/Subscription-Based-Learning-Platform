import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getQuizToTake, submitQuiz } from '../../api/quizApi';
import DashboardLayout from '../../components/DashboardLayout';

export default function QuizPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getQuizToTake(quizId)
      .then((res) => setQuiz(res.data))
      .catch((err) => setError(err.response?.status === 403 ? 'You need an active subscription to take this quiz.' : 'Failed to load quiz.'))
      .finally(() => setLoading(false));
  }, [quizId]);

  const handleSelect = (questionId, choiceId) => setAnswers({ ...answers, [questionId]: choiceId });

  const handleSubmit = async () => {
    const answersArray = Object.entries(answers).map(([question_id, choice_id]) => ({ question_id: parseInt(question_id), choice_id }));
    if (answersArray.length !== quiz.questions.length) {
      setError('Please answer all questions before submitting.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await submitQuiz(quizId, answersArray);
      setResult(res.data);
    } catch {
      setError('Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <DashboardLayout><p className="text-gray-400">Loading quiz...</p></DashboardLayout>;
  if (error && !quiz) return <DashboardLayout><p className="text-red-500">{error}</p></DashboardLayout>;

  if (result) {
    const hasWrongAnswers = result.answers.some((a) => !a.is_correct);
    return (
      <DashboardLayout>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-8 md:p-10 max-w-2xl mx-auto text-center">
          <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl ${result.passed ? 'bg-brand-50 dark:bg-brand-900/40 text-brand-600' : 'bg-red-50 dark:bg-red-950/40 text-red-500'}`}>
            {result.passed ? '🎉' : '📘'}
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Quiz Results</h2>
          <p className={`text-4xl font-extrabold mb-2 ${result.passed ? 'text-brand-600 dark:text-brand-300' : 'text-red-500'}`}>{result.percentage}%</p>
          <p className="text-gray-500 dark:text-slate-400 mb-6">{result.score}/{result.total_marks} marks — {result.passed ? 'Passed' : 'Not Passed'}</p>

          <div className="bg-brand-50/70 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 rounded-xl p-4 text-xs text-brand-950 dark:text-indigo-200 text-left mb-6">
            <span className="font-bold">🧠 Adaptive Insights Updated:</span> Your performance has been logged to your Topic Strengths. {hasWrongAnswers ? 'Missed questions were automatically scheduled for Anki-style Spaced Repetition review.' : 'All answers were correct!'}
          </div>

          <div className="text-left space-y-3 mb-8">
            {result.answers.map((a, i) => (
              <div key={i} className={`p-4 rounded-xl border ${a.is_correct ? 'bg-brand-50/60 dark:bg-slate-800/50 border-brand-200 dark:border-slate-700' : 'bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-900/50'}`}>
                <p className="font-semibold text-gray-900 dark:text-white text-sm whitespace-pre-line">{a.question_text}</p>
                <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">Your answer: {a.selected_choice_text} {a.is_correct ? '✓' : '✗'}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={() => navigate(-1)} className="bg-brand-600 hover:bg-brand-700 text-white text-xs md:text-sm font-semibold px-5 py-2.5 rounded-xl transition cursor-pointer">
              Back to Course
            </button>
            <Link to={`/student/adaptive-quiz/${quizId}`} className="bg-brand-700 hover:bg-brand-800 text-white text-xs md:text-sm font-semibold px-5 py-2.5 rounded-xl transition">
              Try Adaptive Mode ➔
            </Link>
            {hasWrongAnswers && (
              <Link to="/student/spaced-repetition" className="bg-brand-800 hover:bg-brand-900 text-white text-xs md:text-sm font-semibold px-5 py-2.5 rounded-xl transition">
                Review Missed in Anki 🔁
              </Link>
            )}
            <Link to="/student/topic-strengths" className="border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-xs md:text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition">
              Topic Strengths 📊
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-8 max-w-2xl mx-auto">
        {/* Adaptive Mode Banner */}
        <div className="mb-6 bg-gradient-to-r from-brand-800 to-brand-700 text-white p-4 rounded-xl flex items-center justify-between border border-brand-700">
          <div>
            <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider">🧠 Adaptive Mode</p>
            <p className="text-sm font-semibold">Want difficulty to adjust based on your answers?</p>
          </div>
          <Link
            to={`/student/adaptive-quiz/${quizId}`}
            className="text-xs font-bold bg-white hover:bg-gray-100 text-brand-700 px-3.5 py-2 rounded-lg transition shrink-0 ml-3"
          >
            Launch Adaptive ➔
          </Link>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{quiz.title}</h2>
        <p className="text-gray-500 dark:text-slate-400 mb-8">{quiz.description}</p>

        {error && <p className="text-red-600 dark:text-red-300 text-sm mb-4 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 rounded-lg px-3 py-2">{error}</p>}

        {quiz.questions.map((q, idx) => (
          <div key={q.id} className="mb-6">
            <p className="font-bold text-gray-900 dark:text-white mb-3 whitespace-pre-line">{idx + 1}. {q.text}</p>
            <div className="space-y-2">
              {q.choices.map((choice) => (
                <label
                  key={choice.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    answers[q.id] === choice.id ? 'border-brand-600 bg-brand-50/70 dark:bg-brand-900/40 text-gray-900 dark:text-white' : 'border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-800 dark:text-slate-300'
                  }`}
                >
                  <input type="radio" name={`question-${q.id}`} checked={answers[q.id] === choice.id} onChange={() => handleSelect(q.id, choice.id)} className="accent-brand-600" />
                  <span className="text-sm">{choice.text}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50 transition cursor-pointer"
        >
          {submitting ? 'Submitting...' : 'Submit Quiz'}
        </button>
      </div>
    </DashboardLayout>
  );
}