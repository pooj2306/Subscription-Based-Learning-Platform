import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCourseLessons, createLesson } from '../../api/instructorApi';
import DashboardLayout from '../../components/DashboardLayout';
import BackLink from '../../components/BackLink';
export default function ManageLessons() {
  const { courseId } = useParams();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', order: 1, video_url: '', duration_minutes: 10 });
  const [error, setError] = useState('');

  const loadLessons = () => {
    getCourseLessons(courseId).then((res) => setLessons(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { loadLessons(); }, [courseId]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createLesson(courseId, form);
      setForm({ title: '', order: lessons.length + 2, video_url: '', duration_minutes: 10 });
      setShowForm(false);
      loadLessons();
    } catch (err) {
      setError('Failed to add lesson.');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <p className="text-gray-400">Loading...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <BackLink to="/instructor" label="Back to My Courses" />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Manage Lessons</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-brand-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-brand-700 transition"
        >
          {showForm ? 'Cancel' : '+ Add Lesson'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 max-w-xl">
          {error && (
            <p className="text-red-600 text-sm mb-4 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="space-y-3">
            <input name="title" placeholder="Lesson Title" value={form.title} onChange={handleChange}
              className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" required />
            <input name="order" type="number" placeholder="Order" value={form.order} onChange={handleChange}
              className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" required />
            <input name="video_url" placeholder="Video URL" value={form.video_url} onChange={handleChange}
              className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            <input name="duration_minutes" type="number" placeholder="Duration (minutes)" value={form.duration_minutes} onChange={handleChange}
              className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <button
            type="submit"
            className="bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-emerald-700 transition mt-4"
          >
            Save Lesson
          </button>
        </form>
      )}

      <div className="space-y-3 max-w-xl">
        {lessons.map((lesson) => (
          <div key={lesson.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex justify-between items-center">
            <p className="font-medium text-gray-900">{lesson.order}. {lesson.title}</p>
            <p className="text-sm text-gray-400">{lesson.duration_minutes} min</p>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}