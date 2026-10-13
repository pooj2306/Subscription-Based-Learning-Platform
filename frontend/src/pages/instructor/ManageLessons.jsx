import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCourseLessons, createLesson, updateLesson } from '../../api/instructorApi';
import DashboardLayout from '../../components/DashboardLayout';
import BackLink from '../../components/BackLink';

export default function ManageLessons() {
  const { courseId } = useParams();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    module_name: '',
    title: '',
    order: 1,
    video_url: '',
    duration_minutes: 15,
  });
  const [editForm, setEditForm] = useState({
    module_name: '',
    title: '',
    order: 1,
    video_url: '',
    duration_minutes: 15,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('ALL');

  const loadLessons = () => {
    getCourseLessons(courseId)
      .then((res) => setLessons(res.data))
      .catch(() => setError('Failed to load lessons.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLessons();
  }, [courseId]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleEditChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value });

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createLesson(courseId, form);
      setForm({
        module_name: form.module_name,
        title: '',
        order: lessons.length + 1,
        video_url: '',
        duration_minutes: 15,
      });
      setShowForm(false);
      loadLessons();
    } catch {
      setError('Failed to add lesson.');
    }
  };

  const startEditing = (lesson) => {
    setEditingId(lesson.id);
    setEditForm({
      module_name: lesson.module_name || '',
      title: lesson.title,
      order: lesson.order,
      video_url: lesson.video_url || '',
      duration_minutes: lesson.duration_minutes || 15,
    });
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await updateLesson(editingId, editForm);
      setEditingId(null);
      loadLessons();
    } catch {
      setError('Failed to update lesson.');
    } finally {
      setSaving(false);
    }
  };

  // Extract distinct modules
  const uniqueModules = Array.from(new Set(lessons.map((l) => l.module_name || 'General Curriculum')));
  const filteredLessons = selectedModuleFilter === 'ALL'
    ? lessons
    : lessons.filter((l) => (l.module_name || 'General Curriculum') === selectedModuleFilter);

  if (loading) {
    return (
      <DashboardLayout>
        <p className="text-gray-400">Loading lessons...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <BackLink to="/instructor" label="Back to My Courses" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Lessons & Modules</h2>
          <p className="text-sm text-gray-500">
            {lessons.length} lessons organized across {uniqueModules.length} modules
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-brand-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-700 shadow-sm transition"
        >
          {showForm ? '✕ Close Form' : '+ Add New Lesson'}
        </button>
      </div>

      {error && (
        <p className="text-red-600 text-sm mb-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {/* Module Filter pills */}
      {uniqueModules.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          <button
            onClick={() => setSelectedModuleFilter('ALL')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              selectedModuleFilter === 'ALL'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            All Modules ({lessons.length})
          </button>
          {uniqueModules.map((m) => {
            const count = lessons.filter((l) => (l.module_name || 'General Curriculum') === m).length;
            return (
              <button
                key={m}
                onClick={() => setSelectedModuleFilter(m)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                  selectedModuleFilter === m
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {m} ({count})
              </button>
            );
          })}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreateSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8 max-w-2xl">
          <h3 className="text-base font-bold text-gray-900 mb-4">Add New Lesson</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Module Name</label>
              <input
                name="module_name"
                placeholder="e.g. Module 1 — Web Development Fundamentals"
                value={form.module_name}
                onChange={handleChange}
                list="module-list"
                className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <datalist id="module-list">
                {uniqueModules.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Lesson Title</label>
              <input
                name="title"
                placeholder="Lesson Title"
                value={form.title}
                onChange={handleChange}
                className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Order Index</label>
                <input
                  name="order"
                  type="number"
                  placeholder="Order"
                  value={form.order}
                  onChange={handleChange}
                  className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  name="duration_minutes"
                  type="number"
                  placeholder="Duration (minutes)"
                  value={form.duration_minutes}
                  onChange={handleChange}
                  className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Video URL (YouTube or direct MP4)</label>
              <input
                name="video_url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={form.video_url}
                onChange={handleChange}
                className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition"
            >
              Save Lesson
            </button>
          </div>
        </form>
      )}

      {/* Lesson List */}
      <div className="space-y-3 max-w-3xl">
        {filteredLessons.map((lesson) => {
          const isEditing = editingId === lesson.id;
          return (
            <div
              key={lesson.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 transition hover:border-gray-200"
            >
              {isEditing ? (
                <form onSubmit={handleUpdateSubmit} className="space-y-3 pt-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-brand-600">Editing Lesson #{lesson.order}</span>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-xs text-gray-400 hover:text-gray-700"
                    >
                      ✕ Cancel
                    </button>
                  </div>
                  <input
                    name="module_name"
                    placeholder="Module Name"
                    value={editForm.module_name}
                    onChange={handleEditChange}
                    className="w-full border border-gray-200 p-2 rounded-lg text-xs"
                  />
                  <input
                    name="title"
                    placeholder="Lesson Title"
                    value={editForm.title}
                    onChange={handleEditChange}
                    className="w-full border border-gray-200 p-2 rounded-lg text-xs font-semibold"
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      name="order"
                      type="number"
                      placeholder="Order"
                      value={editForm.order}
                      onChange={handleEditChange}
                      className="w-full border border-gray-200 p-2 rounded-lg text-xs"
                      required
                    />
                    <input
                      name="duration_minutes"
                      type="number"
                      placeholder="Duration (min)"
                      value={editForm.duration_minutes}
                      onChange={handleEditChange}
                      className="w-full border border-gray-200 p-2 rounded-lg text-xs"
                    />
                  </div>
                  <input
                    name="video_url"
                    placeholder="Video URL (e.g. YouTube or MP4 link)"
                    value={editForm.video_url}
                    onChange={handleEditChange}
                    className="w-full border border-gray-200 p-2 rounded-lg text-xs"
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
                    >
                      {saving ? 'Saving...' : '✓ Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {lesson.module_name && (
                        <span className="text-[11px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
                          {lesson.module_name}
                        </span>
                      )}
                      {lesson.video_url ? (
                        <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          🎥 Video attached
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          URL pending
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {lesson.order}. {lesson.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-gray-400">{lesson.duration_minutes} min</span>
                    <button
                      onClick={() => startEditing(lesson)}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition"
                    >
                      ✏️ Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}