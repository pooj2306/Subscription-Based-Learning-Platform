import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCourseDetail, getLessons } from '../../api/courseApi';
import { updateLessonProgress, getCourseProgressDetail } from '../../api/progressApi';
import DashboardLayout from '../../components/DashboardLayout';
import BackLink from '../../components/BackLink';

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
      .catch((err) => setError(err.response?.status === 403 ? 'You need an active subscription to view this lesson.' : 'Failed to load lesson.'))
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
    } finally {
      setMarking(false);
    }
  };

  if (loading) return <DashboardLayout><p className="text-gray-400">Loading lesson...</p></DashboardLayout>;

  if (error) {
    return (
      <DashboardLayout>
        <p className="text-red-500 mb-4">{error}</p>
        {error.includes('subscription') && <Link to="/student/plans" className="text-brand-600 underline">Subscribe now</Link>}
        <br />
        <BackLink to={`/student/courses/${courseId}`} label={`Back to ${courseTitle}`} />
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

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-3xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{currentLesson.title}</h2>
        <p className="text-gray-400 text-sm mb-5">{currentLesson.duration_minutes} min</p>

        {currentLesson.video_url && (
          <div className="mb-6">
            {youtubeEmbedUrl ? (
              <div className="aspect-video rounded-xl overflow-hidden">
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
        )}

        {currentLesson.materials?.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Materials</h3>
            <ul className="space-y-1">
              {currentLesson.materials.map((m) => (
                <li key={m.id}>
                  <a href={m.file} target="_blank" rel="noreferrer" className="text-brand-600 underline text-sm">
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
          className="bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50 mb-6 transition"
        >
          {completed ? '✓ Marked Complete' : marking ? 'Saving...' : 'Mark as Complete'}
        </button>

        {courseProgress && (
          <p className="text-sm text-gray-500 mb-6">
            Course progress: {courseProgress.completed_lessons}/{courseProgress.total_lessons} lessons ({courseProgress.progress_percent}%)
            {courseProgress.is_course_completed && <span className="text-emerald-600 font-semibold"> — Course completed! 🎉</span>}
          </p>
        )}

        <div className="flex justify-between border-t border-gray-100 pt-4 text-sm">
          {prevLesson ? (
            <Link to={`/student/courses/${courseId}/lessons/${prevLesson.id}`} className="text-brand-600 hover:underline font-medium">
              ← {prevLesson.title}
            </Link>
          ) : <span />}
          {nextLesson ? (
            <Link to={`/student/courses/${courseId}/lessons/${nextLesson.id}`} className="text-brand-600 hover:underline font-medium">
              {nextLesson.title} →
            </Link>
          ) : <span />}
        </div>
      </div>
    </DashboardLayout>
  );
}