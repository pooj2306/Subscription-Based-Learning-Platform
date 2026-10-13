import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCourseDetail, getLessons } from '../../api/courseApi';
import { updateLessonProgress, getCourseProgressDetail } from '../../api/progressApi';
import DashboardLayout from '../../components/DashboardLayout';
import BackLink from '../../components/BackLink';
import PomodoroTimer from '../../components/PomodoroTimer';

function getYouTubeEmbedUrl(url) {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export default function LessonDetail() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [courseProgress, setCourseProgress] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([getCourseDetail(courseId), getLessons(courseId)])
      .then(([courseRes, lessonsRes]) => {
        setCourseTitle(courseRes.data.title);
        setLessons(lessonsRes.data);
        setCurrentLesson(lessonsRes.data.find((l) => String(l.id) === lessonId));
      })
      .catch((err) => {
        const detail = err.response?.data?.detail;
        if (err.response?.status === 403) {
          setError(detail || 'Access to this course is stopped. If your subscription is paused, please resume your subscription to continue learning.');
        } else {
          setError(detail || 'Failed to load lesson.');
        }
      })
      .finally(() => setLoading(false));

    getCourseProgressDetail(courseId).then((res) => setCourseProgress(res.data)).catch(() => setCourseProgress(null));
  }, [courseId, lessonId]);

  const handleMarkComplete = async () => {
    setMarking(true);
    try {
      await updateLessonProgress({ lesson_id: parseInt(lessonId), is_completed: true, last_watched_position_seconds: 0 });
      setCompleted(true);
      const res = await getCourseProgressDetail(courseId);
      setCourseProgress(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update lesson progress.');
    } finally {
      setMarking(false);
    }
  };

  if (loading) return <DashboardLayout><p className="text-gray-400">Loading lesson...</p></DashboardLayout>;

  if (error) {
    const isPaused = error.toLowerCase().includes('pause');
    return (
      <DashboardLayout>
        <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 max-w-2xl mb-6 shadow-xs">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{isPaused ? '⏸️' : '🔒'}</span>
            <h3 className="font-extrabold text-gray-900 dark:text-white text-base">
              {isPaused ? 'Subscription Paused' : 'Subscription Required'}
            </h3>
          </div>
          <p className="text-gray-700 dark:text-slate-300 text-sm mb-4 leading-relaxed">{error}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/student/plans"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              {isPaused ? '▶️ Go to Plans & Resume' : 'View Subscription Plans ➔'}
            </Link>
            <Link
              to={`/student/courses/${courseId}`}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-bold text-xs rounded-xl transition"
            >
              Back to Course
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!currentLesson) return <DashboardLayout><p className="text-red-500">Lesson not found.</p></DashboardLayout>;

  const currentIndex = lessons.findIndex((l) => String(l.id) === lessonId);
  const prevLesson = lessons[currentIndex - 1];
  const nextLesson = lessons[currentIndex + 1];
  const youtubeEmbedUrl = currentLesson.video_url ? getYouTubeEmbedUrl(currentLesson.video_url) : null;

  return (
    <DashboardLayout>
      <BackLink to={`/student/courses/${courseId}`} label={`Back to ${courseTitle}`} />

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-8 max-w-3xl">
        {currentLesson.module_name && (
          <div className="mb-2">
            <span className="inline-flex items-center text-xs font-semibold text-brand-700 dark:text-indigo-300 bg-brand-50 dark:bg-brand-900/30 border border-brand-100 dark:border-brand-800 px-3 py-1 rounded-full">
              📚 {currentLesson.module_name}
            </span>
          </div>
        )}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{currentLesson.title}</h2>
        <p className="text-gray-400 dark:text-slate-400 text-sm mb-5">{currentLesson.duration_minutes} min</p>

        {currentLesson.video_url ? (
          <div className="mb-6">
            {youtubeEmbedUrl ? (
              <div className="aspect-video rounded-xl overflow-hidden shadow-sm">
                <iframe
                  className="w-full h-full"
                  src={youtubeEmbedUrl}
                  title={currentLesson.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <video controls className="w-full rounded-xl bg-black" src={currentLesson.video_url} />
            )}
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-slate-800/60 border border-dashed border-gray-200 dark:border-slate-800 rounded-xl p-8 text-center mb-6">
            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-xl shadow-xs mx-auto mb-3">
              📖
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-white text-sm mb-1">{currentLesson.title}</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
              Video lecture and notes will be available soon. You can review the topic concepts and mark as complete when ready.
            </p>
          </div>
        )}

        {currentLesson.notes && (
          <div className="bg-indigo-50/50 dark:bg-slate-800/60 border border-indigo-100 dark:border-slate-800 rounded-2xl p-6 mb-6 shadow-xs">
            <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-indigo-100 dark:border-slate-700">
              <span className="text-base">📝</span>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Study Notes & Key Concepts</h3>
            </div>
            <div className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {currentLesson.notes}
            </div>
          </div>
        )}

        {/* Built-in Focus Mode & Pomodoro Timer */}
        <div className="mb-8">
          <PomodoroTimer courseId={courseId} lessonId={currentLesson.id} />
        </div>

        {currentLesson.materials?.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Materials</h3>
            <ul className="space-y-1">
              {currentLesson.materials.map((m) => (
                <li key={m.id}>
                  <a href={m.file} target="_blank" rel="noreferrer" className="text-brand-600 dark:text-indigo-400 underline text-sm">
                    📄 {m.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={handleMarkComplete}
          disabled={marking || completed}
          className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-50 mb-6 transition cursor-pointer"
        >
          {completed ? '✓ Marked Complete' : marking ? 'Saving...' : 'Mark as Complete'}
        </button>

        {courseProgress && (
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
            Course progress: {courseProgress.completed_lessons}/{courseProgress.total_lessons} lessons ({courseProgress.progress_percent}%)
            {courseProgress.is_course_completed && <span className="text-brand-600 dark:text-brand-300 font-semibold"> — Course completed! 🎉</span>}
          </p>
        )}

        <div className="flex justify-between border-t border-gray-100 dark:border-slate-800 pt-4 text-sm">
          {prevLesson ? (
            <Link to={`/student/courses/${courseId}/lessons/${prevLesson.id}`} className="text-brand-600 dark:text-indigo-400 hover:underline font-medium">
              ← {prevLesson.title}
            </Link>
          ) : <span />}
          {nextLesson ? (
            <Link to={`/student/courses/${courseId}/lessons/${nextLesson.id}`} className="text-brand-600 dark:text-indigo-400 hover:underline font-medium">
              {nextLesson.title} →
            </Link>
          ) : <span />}
        </div>
      </div>
    </DashboardLayout>
  );
}