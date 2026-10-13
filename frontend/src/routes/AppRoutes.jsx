import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../auth/Login';
import Register from '../auth/Register';
import ProtectedRoute from '../auth/ProtectedRoute';
import LandingPage from '../pages/public/LandingPage';
import HelpDesk from '../pages/public/HelpDesk';
import StudentDashboard from '../pages/student/StudentDashboard';
import SubscriptionPlans from '../pages/student/SubscriptionPlans';
import CourseDetail from '../pages/student/CourseDetail';
import LessonDetail from '../pages/student/LessonDetail';
import QuizPage from '../pages/student/QuizPage';
import Certificates from '../pages/student/Certificates';
import AdaptiveQuizPage from '../pages/student/AdaptiveQuizPage';
import TopicStrengthsPage from '../pages/student/TopicStrengthsPage';
import SpacedRepetitionPage from '../pages/student/SpacedRepetitionPage';
import RoadmapsPage from '../pages/student/RoadmapsPage';
import LeaderboardPage from '../pages/student/LeaderboardPage';
import StudyGroupsPage from '../pages/student/StudyGroupsPage';
import StudentAnalyticsPage from '../pages/student/StudentAnalyticsPage';
import InstructorDashboard from '../pages/instructor/InstructorDashboard';
import InstructorAnalyticsPage from '../pages/instructor/InstructorAnalyticsPage';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AddCourse from '../pages/instructor/AddCourse';
import ManageLessons from '../pages/instructor/ManageLessons';
import ManageQuizzes from '../pages/instructor/ManageQuizzes';

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── Public Routes (Part 1, 2, 5) ── */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/demo" element={<StudentDashboard isDemo={true} />} />
      <Route path="/demo/courses/:courseId" element={<CourseDetail isDemo={true} />} />
      <Route path="/help" element={<HelpDesk />} />

      {/* ── Authentication Routes ── */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ── Student Protected Routes ── */}
      <Route path="/student" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/help" element={<ProtectedRoute allowedRoles={['STUDENT']}><HelpDesk /></ProtectedRoute>} />
      <Route path="/student/plans" element={<ProtectedRoute allowedRoles={['STUDENT']}><SubscriptionPlans /></ProtectedRoute>} />
      <Route path="/student/courses/:courseId" element={<ProtectedRoute allowedRoles={['STUDENT']}><CourseDetail /></ProtectedRoute>} />
      <Route path="/student/courses/:courseId/lessons/:lessonId" element={<ProtectedRoute allowedRoles={['STUDENT']}><LessonDetail /></ProtectedRoute>} />
      <Route path="/student/quizzes/:quizId" element={<ProtectedRoute allowedRoles={['STUDENT']}><QuizPage /></ProtectedRoute>} />
      <Route path="/student/certificates" element={<ProtectedRoute allowedRoles={['STUDENT']}><Certificates /></ProtectedRoute>} />

      {/* Analytics & Performance Routes */}
      <Route path="/student/analytics" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentAnalyticsPage /></ProtectedRoute>} />

      {/* Engagement & Motivation Routes */}
      <Route path="/student/roadmaps" element={<ProtectedRoute allowedRoles={['STUDENT']}><RoadmapsPage /></ProtectedRoute>} />
      <Route path="/student/leaderboard" element={<ProtectedRoute allowedRoles={['STUDENT']}><LeaderboardPage /></ProtectedRoute>} />
      <Route path="/student/study-groups" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudyGroupsPage /></ProtectedRoute>} />

      {/* Adaptive Learning Routes */}
      <Route path="/student/adaptive-quiz/:quizId" element={<ProtectedRoute allowedRoles={['STUDENT']}><AdaptiveQuizPage /></ProtectedRoute>} />
      <Route path="/student/topic-strengths" element={<ProtectedRoute allowedRoles={['STUDENT']}><TopicStrengthsPage /></ProtectedRoute>} />
      <Route path="/student/spaced-repetition" element={<ProtectedRoute allowedRoles={['STUDENT']}><SpacedRepetitionPage /></ProtectedRoute>} />

      {/* Instructor Routes */}
      <Route path="/instructor" element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorDashboard /></ProtectedRoute>} />
      <Route path="/instructor/analytics" element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorAnalyticsPage /></ProtectedRoute>} />
      <Route path="/instructor/courses/new" element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><AddCourse /></ProtectedRoute>} />
      <Route path="/instructor/courses/:courseId/lessons" element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><ManageLessons /></ProtectedRoute>} />
      <Route path="/instructor/courses/:courseId/quizzes" element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><ManageQuizzes /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
    </Routes>
  );
}