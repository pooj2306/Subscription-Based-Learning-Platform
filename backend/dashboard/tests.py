from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from courses.models import Course, Lesson
from assessments.models import Quiz, Question, Choice, QuizAttempt, StudentAnswer
from engagement.models import FocusSession, GamificationProfile
from adaptive_learning.models import Topic, AdaptiveQuestion, StudentTopicScore, SpacedRepetitionCard
from progress.models import LessonProgress, CourseProgress

User = get_user_model()


class DashboardTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="dashadmin", email="dashadmin@example.com",
            password="Pass123!", role="ADMIN",
        )
        self.instructor = User.objects.create_user(
            username="dashinst", email="dashinst@example.com",
            password="Pass123!", role="INSTRUCTOR",
        )
        self.student = User.objects.create_user(
            username="dashstudent", email="dashstudent@example.com",
            password="Pass123!", role="STUDENT",
        )
        self.overview_url = '/api/dashboard/overview/'
        self.student_analytics_url = '/api/dashboard/analytics/student/'
        self.instructor_analytics_url = '/api/dashboard/analytics/instructor/'

    def test_student_cannot_access_dashboard(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(self.overview_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_access_dashboard(self):
        response = self.client.get(self.overview_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_can_access_dashboard(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.overview_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_users', response.data)

    def test_student_analytics(self):
        # Setup data for student
        course = Course.objects.create(
            title="Data Structures", stream="Computer Science",
            instructor=self.instructor, is_published=True,
        )
        l1 = Lesson.objects.create(course=course, title="Arrays Intro", order=1, duration_minutes=20)
        l2 = Lesson.objects.create(course=course, title="Linked Lists", order=2, duration_minutes=30)

        # Progress
        LessonProgress.objects.create(
            student=self.student, lesson=l1, is_completed=True, last_watched_position_seconds=1200,
        )
        LessonProgress.objects.create(
            student=self.student, lesson=l2, is_completed=False, last_watched_position_seconds=300,
        )
        cp = CourseProgress.objects.create(student=self.student, course=course)
        cp.recalculate()

        # Focus session
        FocusSession.objects.create(student=self.student, course=course, duration_minutes=25)

        # Gamification profile
        GamificationProfile.objects.create(student=self.student, xp=250, level=1, current_streak=3)

        # Quiz & Attempt
        quiz = Quiz.objects.create(course=course, title="DS Assessment 1", created_by=self.instructor)
        QuizAttempt.objects.create(
            student=self.student, quiz=quiz, score=80.0, total_marks=100.0, percentage=80.0, passed=True,
        )

        # Topic & score
        topic = Topic.objects.create(name="Arrays", course=course)
        StudentTopicScore.objects.create(
            student=self.student, topic=topic, total_attempted=10, total_correct=8,
        )

        self.client.force_authenticate(user=self.student)
        response = self.client.get(self.student_analytics_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertIn('time_spent', data)
        self.assertIn('accuracy_trends', data)
        self.assertIn('exam_readiness', data)

        # Verify time spent
        self.assertGreater(data['time_spent']['total_study_minutes'], 0)
        self.assertEqual(len(data['time_spent']['daily_breakdown']), 7)
        self.assertEqual(data['time_spent']['streak_days'], 3)

        # Verify accuracy trends
        self.assertEqual(data['accuracy_trends']['overall_accuracy'], 80.0)
        self.assertEqual(len(data['accuracy_trends']['attempt_history']), 1)
        self.assertEqual(len(data['accuracy_trends']['topic_breakdown']), 1)

        # Verify predicted exam readiness
        self.assertIn('readiness_score', data['exam_readiness'])
        self.assertIn('readiness_tier', data['exam_readiness'])
        self.assertIn('pass_probability', data['exam_readiness'])
        self.assertIn('advice', data['exam_readiness'])

    def test_instructor_analytics(self):
        # Setup data for instructor
        course = Course.objects.create(
            title="Algorithms Masterclass", stream="Computer Science",
            instructor=self.instructor, is_published=True,
        )
        l1 = Lesson.objects.create(course=course, title="Recursion Basics", order=1, duration_minutes=25)
        l2 = Lesson.objects.create(course=course, title="Dynamic Programming", order=2, duration_minutes=40)

        # 2 students with different progress to test drop-off
        s2 = User.objects.create_user(
            username="student2", email="student2@example.com", password="Pass123!", role="STUDENT",
        )
        LessonProgress.objects.create(student=self.student, lesson=l1, is_completed=True)
        LessonProgress.objects.create(student=s2, lesson=l1, is_completed=False)  # dropped off

        LessonProgress.objects.create(student=self.student, lesson=l2, is_completed=False)  # dropped off

        # Quiz and questions to test most often missed
        quiz = Quiz.objects.create(course=course, title="Algo Quiz 1", created_by=self.instructor)
        q1 = Question.objects.create(quiz=quiz, text="What is the base case of factorial?", order=1)
        c1 = Choice.objects.create(question=q1, text="n == 0 or n == 1", is_correct=True)
        c2 = Choice.objects.create(question=q1, text="n == 10", is_correct=False)
        c3 = Choice.objects.create(question=q1, text="Infinite loop", is_correct=False)

        att1 = QuizAttempt.objects.create(student=self.student, quiz=quiz, score=0, total_marks=1, percentage=0, passed=False)
        att2 = QuizAttempt.objects.create(student=s2, quiz=quiz, score=0, total_marks=1, percentage=0, passed=False)

        StudentAnswer.objects.create(attempt=att1, question=q1, selected_choice=c2, is_correct=False)
        StudentAnswer.objects.create(attempt=att2, question=q1, selected_choice=c2, is_correct=False)

        # Authenticate as instructor
        self.client.force_authenticate(user=self.instructor)
        response = self.client.get(self.instructor_analytics_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertIn('lesson_dropoff', data)
        self.assertIn('most_missed_questions', data)
        self.assertIn('summary', data)

        # Check lesson drop-off stats
        l1_stats = next(x for x in data['lesson_dropoff'] if x['lesson_id'] == l1.id)
        self.assertEqual(l1_stats['started_count'], 2)
        self.assertEqual(l1_stats['completed_count'], 1)
        self.assertEqual(l1_stats['drop_off_count'], 1)
        self.assertEqual(l1_stats['drop_off_rate'], 50.0)

        # Check most missed questions
        self.assertEqual(len(data['most_missed_questions']), 1)
        missed_q = data['most_missed_questions'][0]
        self.assertEqual(missed_q['question_id'], q1.id)
        self.assertEqual(missed_q['failure_rate'], 100.0)
        self.assertEqual(missed_q['most_common_wrong_choice'], "n == 10")
        self.assertEqual(missed_q['trap_count'], 2)

    def test_student_cannot_access_instructor_analytics(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(self.instructor_analytics_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_industry_trends_endpoint(self):
        response = self.client.get('/api/dashboard/industry-trends/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('trending_programs', response.data)
        self.assertIn('trending_projects', response.data)
        self.assertIn('tools_radar', response.data)
        self.assertIn('market_insights', response.data)
        self.assertGreater(len(response.data['trending_programs']), 0)
        self.assertGreater(len(response.data['trending_projects']), 0)
        self.assertGreater(len(response.data['tools_radar']), 0)