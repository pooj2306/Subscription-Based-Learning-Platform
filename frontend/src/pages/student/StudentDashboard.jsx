import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCourses } from '../../api/courseApi';
import { getMySubscriptions } from '../../api/subscriptionApi';
import DashboardLayout from '../../components/DashboardLayout';

export default function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCourses(), getMySubscriptions()])
      .then(([coursesRes, subsRes]) => {
        setCourses(coursesRes.data);
        setHasActiveSubscription(subsRes.data.some((sub) => sub.is_active));
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <p className="text-gray-400">Loading your dashboard...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back 👋</h2>
      <p className="text-gray-500 mb-6">Pick up where you left off, or explore something new.</p>

      {!hasActiveSubscription && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-5 py-4 rounded-xl mb-8 flex items-center justify-between">
          <span className="text-sm font-medium">You don't have an active subscription yet.</span>
          <Link
            to="/student/plans"
            className="bg-amber-500 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-amber-600 transition"
          >
            Subscribe Now
          </Link>
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Courses</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {courses.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition flex flex-col"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full">
                {course.level}
              </span>
              <span className="text-xs text-gray-400">{course.stream}</span>
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">{course.title}</h4>
            <p className="text-sm text-gray-500 mb-4 flex-1">{course.description}</p>
            <p className="text-xs text-gray-400 mb-4">{course.lessons.length} lessons</p>
            <Link
              to={`/student/courses/${course.id}`}
              className="text-center bg-brand-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-brand-700 transition"
            >
              View Course
            </Link>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}