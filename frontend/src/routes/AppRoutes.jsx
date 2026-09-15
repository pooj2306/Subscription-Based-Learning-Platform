import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../auth/Login';
import Register from '../auth/Register';
import ProtectedRoute from '../auth/ProtectedRoute';
import StudentDashboard from '../pages/student/StudentDashboard';
import SubscriptionPlans from '../pages/student/SubscriptionPlans';
import CourseDetail from '../pages/student/CourseDetail';
import LessonDetail from '../pages/student/LessonDetail';
import QuizPage from '../pages/student/QuizPage';
import Certificates from '../pages/student/Certificates';
import InstructorDashboard from '../pages/instructor/InstructorDashboard';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AddCourse from '../pages/instructor/AddCourse';
import ManageLessons from '../pages/instructor/ManageLessons';
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/student" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/plans" element={<ProtectedRoute allowedRoles={['STUDENT']}><SubscriptionPlans /></ProtectedRoute>} />
      <Route path="/student/courses/:courseId" element={<ProtectedRoute allowedRoles={['STUDENT']}><CourseDetail /></ProtectedRoute>} />
      <Route path="/student/courses/:courseId/lessons/:lessonId" element={<ProtectedRoute allowedRoles={['STUDENT']}><LessonDetail /></ProtectedRoute>} />
      <Route path="/student/quizzes/:quizId" element={<ProtectedRoute allowedRoles={['STUDENT']}><QuizPage /></ProtectedRoute>} />
      <Route path="/student/certificates" element={<ProtectedRoute allowedRoles={['STUDENT']}><Certificates /></ProtectedRoute>} />

      <Route path="/instructor" element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><InstructorDashboard /></ProtectedRoute>} />
      <Route path="/instructor/courses/new" element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><AddCourse /></ProtectedRoute>} />
      <Route path="/instructor/courses/:courseId/lessons" element={<ProtectedRoute allowedRoles={['INSTRUCTOR']}><ManageLessons /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
    </Routes>
  );
}