import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCourseQuizzes } from '../../api/quizApi';
import {
  getCourseTopics,
  createTopic,
  getInstructorQuizQuestions,
  bulkSetAdaptiveMeta,
} from '../../api/adaptiveApi';
import DashboardLayout from '../../components/DashboardLayout';
import BackLink from '../../components/BackLink';

export default function ManageQuizzes() {
  const { courseId } = useParams();
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [topics, setTopics] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // New Topic Form
  const [newTopicName, setNewTopicName] = useState('');
  const [creatingTopic, setCreatingTopic] = useState(false);

  // Question Meta edits: { [qId]: { difficulty, topic_id } }
  const [edits, setEdits] = useState({});

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  const loadCourseData = async () => {
    setLoading(true);
    try {
      const [quizzesRes, topicsRes] = await Promise.all([
        getCourseQuizzes(courseId),
        getCourseTopics(courseId),
      ]);
      setQuizzes(quizzesRes.data || []);
      setTopics(topicsRes.data || []);
      if (quizzesRes.data?.length > 0) {
        setSelectedQuizId(quizzesRes.data[0].id);
        loadQuestions(quizzesRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadQuestions = async (quizId) => {
    try {
      const res = await getInstructorQuizQuestions(quizId);
      const qList = res.data.questions || [];
      setQuestions(qList);
      // Pre-fill edits
      const initialEdits = {};
      qList.forEach((q) => {
        initialEdits[q.id] = {
          difficulty: q.difficulty || 2,
          topic_id: q.topic || '',
        };
      });
      setEdits(initialEdits);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectQuiz = (qId) => {
    setSelectedQuizId(qId);
    loadQuestions(qId);
    setMessage('');
  };

  const handleEditChange = (qId, field, value) => {
    setEdits((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        [field]: value === '' ? null : (field === 'difficulty' ? parseInt(value) : parseInt(value)),
      },
    }));
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    setCreatingTopic(true);
    try {
      const res = await createTopic(courseId, { name: newTopicName.trim() });
      setTopics((prev) => [...prev, res.data]);
      setNewTopicName('');
      setMessage(`Topic "${res.data.name}" added successfully.`);
    } catch (err) {
      console.error(err);
      alert('Failed to create topic. Name might already exist.');
    } finally {
      setCreatingTopic(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setMessage('');
    try {
      const payload = Object.entries(edits).map(([qId, meta]) => ({
        question_id: parseInt(qId),
        difficulty: meta.difficulty,
        topic_id: meta.topic_id || null,
      }));
      await bulkSetAdaptiveMeta(payload);
      setMessage('✓ Saved all question topics and difficulty levels!');
      loadQuestions(selectedQuizId);
    } catch (err) {
      console.error(err);
      setMessage('Failed to save question metadata.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <p className="text-gray-400">Loading quizzes & topics...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto pb-12">
        <BackLink to="/instructor" label="Back to My Courses" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Manage Quizzes & Topic Tagging
            </h2>
            <p className="text-gray-500 text-sm mt-0.5">
              Tag questions with topics and calibrate difficulty for the Adaptive Engine and Weak-Topic Detector.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving || questions.length === 0}
            className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold px-6 py-3 rounded-xl transition shadow-md disabled:opacity-50 text-sm cursor-pointer"
          >
            {saving ? 'Saving...' : '💾 Save All Question Tags'}
          </button>
        </div>

        {message && (
          <div className="p-3.5 mb-6 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold">
            {message}
          </div>
        )}

        {/* ── Topic Creation Section ── */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-6">
          <h3 className="font-extrabold text-gray-900 text-sm mb-3 uppercase tracking-wide">
            Course Topics ({topics.length})
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {topics.map((t) => (
              <span
                key={t.id}
                className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-bold"
              >
                🏷️ {t.name}
              </span>
            ))}
            {topics.length === 0 && (
              <span className="text-xs text-gray-400">No topics created yet. Add topics below to tag questions.</span>
            )}
          </div>

          <form onSubmit={handleCreateTopic} className="flex gap-2">
            <input
              type="text"
              placeholder="New Topic Name (e.g., Arrays, Recursion, Trees)"
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={creatingTopic || !newTopicName.trim()}
              className="bg-gray-900 text-white font-bold px-5 py-2.5 rounded-xl text-xs hover:bg-black disabled:opacity-50 transition cursor-pointer"
            >
              {creatingTopic ? 'Adding...' : '+ Add Topic'}
            </button>
          </form>
        </div>

        {/* ── Quiz Selector ── */}
        {quizzes.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
            {quizzes.map((qz) => (
              <button
                key={qz.id}
                type="button"
                onClick={() => handleSelectQuiz(qz.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedQuizId === qz.id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                📝 {qz.title}
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <p className="text-gray-400">No quizzes found for this course.</p>
          </div>
        )}

        {/* ── Questions Tagging Table ── */}
        {questions.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-extrabold text-gray-900 text-sm">
                Questions in Selected Quiz ({questions.length})
              </h3>
              <span className="text-xs text-gray-400">Adjust difficulty and assign topic</span>
            </div>

            <div className="divide-y divide-gray-100">
              {questions.map((q, idx) => {
                const currentEdit = edits[q.id] || { difficulty: 2, topic_id: '' };
                return (
                  <div key={q.id} className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-5 h-5 rounded-full bg-brand-50 text-brand-700 font-bold text-[11px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs text-gray-400">{q.marks} mark(s)</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 leading-snug">
                        {q.text}
                      </p>
                    </div>

                    {/* Metadata Controls */}
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Topic Selector */}
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Topic</label>
                        <select
                          value={currentEdit.topic_id || ''}
                          onChange={(e) => handleEditChange(q.id, 'topic_id', e.target.value)}
                          className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                          <option value="">-- No Topic Tag --</option>
                          {topics.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Difficulty Selector */}
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Difficulty</label>
                        <select
                          value={currentEdit.difficulty}
                          onChange={(e) => handleEditChange(q.id, 'difficulty', e.target.value)}
                          className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                          <option value="1">🌱 Level 1 (Easy)</option>
                          <option value="2">⚡ Level 2 (Medium)</option>
                          <option value="3">🔥 Level 3 (Hard)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
