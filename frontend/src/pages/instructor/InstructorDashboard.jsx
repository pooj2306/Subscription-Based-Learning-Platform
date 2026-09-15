import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyCourses } from '../../api/instructorApi';
import { useAuth } from '../../auth/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';

export default function InstructorDashboard() {
  const { user } = useAuth();
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyCourses()
      .then((res) => {
        const mine = res.data.filter((c) => c.instructor_name === user.username);
        setMyCourses(mine);
      })
      .finally(() => setLoading(false));
  }, [user.username]);

  if (loading) {
    return (
      <DashboardLayout>
        <p className="text-gray-400">Loading...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Courses</h2>
          <p className="text-gray-500 text-sm mt-1">Manage the courses you teach.</p>
        </div>
        <Link
          to="/instructor/courses/new"
          className="bg-brand-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-brand-700 transition"
        >
          + Add Course
        </Link>
      </div>

      {myCourses.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <p className="text-gray-400">You haven't created any courses yet.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {myCourses.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition flex flex-col"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full">
                {course.level}
              </span>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  course.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {course.is_published ? 'Published' : 'Draft'}
              </span>
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-1">{course.title}</h4>
            <p className="text-sm text-gray-500 mb-4 flex-1">{course.stream}</p>
            <p className="text-xs text-gray-400 mb-4">{course.lessons.length} lessons</p>
            <Link
              to={`/instructor/courses/${course.id}/lessons`}
              className="text-center bg-gray-900 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-gray-800 transition"
            >
              Manage Lessons
            </Link>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}