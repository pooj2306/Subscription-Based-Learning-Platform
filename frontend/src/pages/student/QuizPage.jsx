import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    return (
      <DashboardLayout>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-2xl mx-auto text-center">
          <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl ${result.passed ? 'bg-emerald-50' : 'bg-red-50'}`}>
            {result.passed ? '🎉' : '📘'}
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Quiz Results</h2>
          <p className={`text-4xl font-extrabold mb-2 ${result.passed ? 'text-emerald-600' : 'text-red-500'}`}>{result.percentage}%</p>
          <p className="text-gray-500 mb-8">{result.score}/{result.total_marks} marks — {result.passed ? 'Passed' : 'Not Passed'}</p>

          <div className="text-left space-y-3 mb-8">
            {result.answers.map((a, i) => (
              <div key={i} className={`p-4 rounded-xl border ${a.is_correct ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                <p className="font-medium text-gray-800 text-sm whitespace-pre-line">{a.question_text}</p>
                <p className="text-sm text-gray-600 mt-1">Your answer: {a.selected_choice_text} {a.is_correct ? '✓' : '✗'}</p>
              </div>
            ))}
          </div>

          <button onClick={() => navigate(-1)} className="bg-brand-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-brand-700 transition">
            Back to Course
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{quiz.title}</h2>
        <p className="text-gray-500 mb-8">{quiz.description}</p>

        {error && <p className="text-red-600 text-sm mb-4 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

        {quiz.questions.map((q, idx) => (
          <div key={q.id} className="mb-6">
            <p className="font-medium text-gray-900 mb-3 whitespace-pre-line">{idx + 1}. {q.text}</p>
            <div className="space-y-2">
              {q.choices.map((choice) => (
                <label
                  key={choice.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    answers[q.id] === choice.id ? 'border-brand-500 bg-brand-50' : 'border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <input type="radio" name={`question-${q.id}`} checked={answers[q.id] === choice.id} onChange={() => handleSelect(q.id, choice.id)} />
                  <span className="text-sm text-gray-800">{choice.text}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-brand-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition"
        >
          {submitting ? 'Submitting...' : 'Submit Quiz'}
        </button>
      </div>
    </DashboardLayout>
  );
}