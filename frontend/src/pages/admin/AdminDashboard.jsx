import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { getOverview, getUserStats, getRevenueStats, getCourseStats, getQuizStats } from '../../api/dashboardApi';
import DashboardLayout from '../../components/DashboardLayout';

const COLORS = ['#4f6ef7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [revenueStats, setRevenueStats] = useState(null);
  const [courseStats, setCourseStats] = useState([]);
  const [quizStats, setQuizStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getOverview(), getUserStats(), getRevenueStats(), getCourseStats(), getQuizStats()])
      .then(([ov, us, rev, courses, quiz]) => {
        setOverview(ov.data);
        setUserStats(us.data);
        setRevenueStats(rev.data);
        setCourseStats(courses.data);
        setQuizStats(quiz.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <p className="text-gray-400">Loading dashboard...</p>
      </DashboardLayout>
    );
  }

  const userPieData = userStats ? [
    { name: 'Students', value: userStats.total_students },
    { name: 'Instructors', value: userStats.total_instructors },
    { name: 'Admins', value: userStats.total_admins },
  ] : [];

  const revenuePieData = revenueStats?.revenue_by_plan.map((p) => ({
    name: p.plan__name, value: p.revenue,
  })) || [];

  return (
    <DashboardLayout>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Overview</h2>
      <p className="text-gray-500 text-sm mb-8">Platform-wide stats at a glance.</p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Users" value={overview.total_users} />
        <StatCard label="Total Courses" value={overview.total_courses} />
        <StatCard label="Active Subs" value={overview.total_active_subscriptions} />
        <StatCard label="Revenue" value={`₹${overview.total_revenue}`} />
        <StatCard label="Quiz Attempts" value={overview.total_quiz_attempts} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Users by Role</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={userPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {userPieData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue by Plan</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={revenuePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {revenuePieData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">Course Engagement</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={courseStats}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
            <XAxis dataKey="course_title" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total_enrollments" fill="#4f6ef7" name="Enrollments" radius={[4, 4, 0, 0]} />
            <Bar dataKey="completed_count" fill="#10b981" name="Completed" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Quiz Performance</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-emerald-600">{quizStats.passed_attempts}</p>
            <p className="text-sm text-gray-500">Passed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-500">{quizStats.failed_attempts}</p>
            <p className="text-sm text-gray-500">Failed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-brand-600">{quizStats.average_score_percent}%</p>
            <p className="text-sm text-gray-500">Avg Score</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
      <p className="text-2xl font-bold text-brand-600">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}