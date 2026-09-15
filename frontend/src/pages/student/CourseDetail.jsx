import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCourseDetail } from '../../api/courseApi';
import { getCourseQuizzes } from '../../api/quizApi';
import { requestCertificate } from '../../api/certificateApi';
import { getCourseProgressDetail } from '../../api/progressApi';
import DashboardLayout from '../../components/DashboardLayout';
import BackLink from '../../components/BackLink';
export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [progress, setProgress] = useState(null);
  const [certMessage, setCertMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCourseDetail(courseId).then((res) => setCourse(res.data)).catch(() => setError('Failed to load course.')).finally(() => setLoading(false));
    getCourseQuizzes(courseId).then((res) => setQuizzes(res.data)).catch(() => setQuizzes([]));
    getCourseProgressDetail(courseId).then((res) => setProgress(res.data)).catch(() => setProgress(null));
  }, [courseId]);

  const handleRequestCertificate = async () => {
    setCertMessage('');
    try {
      await requestCertificate(courseId);
      setCertMessage('Certificate generated! Check "Certificates" in the sidebar.');
    } catch (err) {
      setCertMessage(err.response?.data?.detail || 'Could not generate certificate.');
    }
  };

  if (loading) return <DashboardLayout><p className="text-gray-400">Loading course...</p></DashboardLayout>;
  if (error) return <DashboardLayout><p className="text-red-500">{error}</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <BackLink to="/student" label="Back to Dashboard" />

      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full">{course.level}</span>
        <span className="text-xs text-gray-400">{course.stream}</span>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">{course.title}</h2>
      <p className="text-gray-500 text-sm mb-6">by {course.instructor_name}</p>
      <p className="text-gray-700 mb-8 max-w-2xl">{course.description}</p>

      {progress && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-8 max-w-2xl">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium text-gray-700">
              {progress.completed_lessons}/{progress.total_lessons} lessons complete
            </p>
            <p className="text-sm font-bold text-brand-600">{progress.progress_percent}%</p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-brand-500 to-accent-500 h-2.5 rounded-full transition-all"
              style={{ width: `${progress.progress_percent}%` }}
            />
          </div>
          {progress.is_course_completed && (
            <button
              onClick={handleRequestCertificate}
              className="mt-4 bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-emerald-700 transition"
            >
              🎓 Get Certificate
            </button>
          )}
          {certMessage && <p className="text-sm mt-3 text-brand-600 font-medium">{certMessage}</p>}
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-900 mb-4">Lessons</h3>
      <div className="space-y-3 mb-10 max-w-2xl">
        {course.lessons.map((lesson) => (
          <Link
            key={lesson.id}
            to={`/student/courses/${courseId}/lessons/${lesson.id}`}
            className="card-hover block bg-white rounded-xl shadow-sm border border-gray-100 p-4"
          >
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">{lesson.order}. {lesson.title}</span>
              <span className="text-sm text-gray-400">{lesson.duration_minutes} min</span>
            </div>
          </Link>
        ))}
      </div>

      {quizzes.length > 0 && (
        <>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quizzes</h3>
          <div className="space-y-3 max-w-2xl">
            {quizzes.map((quiz) => (
              <Link
                key={quiz.id}
                to={`/student/quizzes/${quiz.id}`}
                className="card-hover block bg-white rounded-xl shadow-sm border border-gray-100 p-4"
              >
                <span className="font-medium text-gray-900">📝 {quiz.title}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}