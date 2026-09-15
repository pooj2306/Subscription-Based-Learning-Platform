import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createCourse } from '../../api/instructorApi';
import DashboardLayout from '../../components/DashboardLayout';
import BackLink from '../../components/BackLink';
export default function AddCourse() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', stream: '', level: 'BEGINNER',
    is_published: true, requires_subscription: true,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await createCourse(form);
      navigate(`/instructor/courses/${res.data.id}/lessons`);
    } catch (err) {
      setError('Failed to create course.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <BackLink to="/instructor" label="Back to My Courses" />

      <div className="max-w-xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Course</h2>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {error && (
            <p className="text-red-600 text-sm mb-4 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
              <input name="title" value={form.title} onChange={handleChange}
                className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3}
                className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stream</label>
              <input name="stream" placeholder="e.g. Computer Science" value={form.stream} onChange={handleChange}
                className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
              <select name="level" value={form.level} onChange={handleChange}
                className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" name="is_published" checked={form.is_published} onChange={handleChange} />
                Publish immediately
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" name="requires_subscription" checked={form.requires_subscription} onChange={handleChange} />
                Requires subscription
              </label>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-brand-600 text-white font-semibold py-2.5 rounded-lg hover:bg-brand-700 transition disabled:opacity-50 mt-6"
          >
            {loading ? 'Creating...' : 'Create Course'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}