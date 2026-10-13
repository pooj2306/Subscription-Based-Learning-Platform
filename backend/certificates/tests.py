from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from courses.models import Course, Lesson
from assessments.models import Quiz, Question, Choice, QuizAttempt
from progress.models import CourseProgress, LessonProgress
from .models import Certificate, CourseMiniProject, ProjectSubmission

User = get_user_model()


class ProjectBasedCertificateTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.instructor = User.objects.create_user(
            username='inst_cert', email='inst@test.com', password='pass', role='INSTRUCTOR',
        )
        self.student = User.objects.create_user(
            username='stu_cert', email='stu@test.com', password='pass', role='STUDENT',
        )
        self.course = Course.objects.create(
            title='DSA in Python', instructor=self.instructor, is_published=True,
        )
        self.lesson = Lesson.objects.create(
            course=self.course, title='Lesson 1', order=1, duration_minutes=20,
        )
        self.quiz = Quiz.objects.create(
            course=self.course, title='DSA Final Exam', created_by=self.instructor, pass_percentage=60,
        )
        self.project = CourseMiniProject.objects.create(
            course=self.course,
            title='LRU Cache Project',
            description='Build an LRU cache',
        )

    def test_certificate_rejected_if_lessons_incomplete(self):
        self.client.force_authenticate(user=self.student)
        res = self.client.post(f'/api/certificates/course/{self.course.id}/request/')
        self.assertEqual(res.status_code, 400)
        self.assertIn("Course lectures not yet completed", res.data['detail'])

    def test_certificate_rejected_if_quiz_not_passed(self):
        # Complete lessons
        CourseProgress.objects.create(
            student=self.student, course=self.course, is_course_completed=True, progress_percent=100.0,
        )
        self.client.force_authenticate(user=self.student)
        res = self.client.post(f'/api/certificates/course/{self.course.id}/request/')
        self.assertEqual(res.status_code, 400)
        self.assertIn("assessment quiz not yet passed", res.data['detail'])

    def test_certificate_rejected_if_project_not_submitted(self):
        # Complete lessons + pass quiz
        CourseProgress.objects.create(
            student=self.student, course=self.course, is_course_completed=True, progress_percent=100.0,
        )
        QuizAttempt.objects.create(
            student=self.student, quiz=self.quiz, score=10, total_marks=10, percentage=100.0, passed=True,
        )
        self.client.force_authenticate(user=self.student)
        res = self.client.post(f'/api/certificates/course/{self.course.id}/request/')
        self.assertEqual(res.status_code, 400)
        self.assertIn("mini-project submission required", res.data['detail'])

    def test_certificate_issued_with_project_and_quiz_credentials(self):
        # 1. Complete lessons
        CourseProgress.objects.create(
            student=self.student, course=self.course, is_course_completed=True, progress_percent=100.0,
        )
        # 2. Pass quiz
        QuizAttempt.objects.create(
            student=self.student, quiz=self.quiz, score=9, total_marks=10, percentage=90.0, passed=True,
        )
        # 3. Submit capstone mini-project
        ProjectSubmission.objects.create(
            project=self.project,
            student=self.student,
            github_repo_url='https://github.com/test/lru-cache',
            description='Implemented with doubly linked list',
            status=ProjectSubmission.Status.APPROVED,
        )

        self.client.force_authenticate(user=self.student)
        res = self.client.post(f'/api/certificates/course/{self.course.id}/request/')
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data['verified_project_title'], 'LRU Cache Project')
        self.assertEqual(res.data['quiz_score'], 90.0)
        self.assertTrue(res.data['certificate_number'].startswith('SBLP-'))

    def test_certification_status_checklist_endpoint(self):
        self.client.force_authenticate(user=self.student)
        res = self.client.get(f'/api/certificates/course/{self.course.id}/status/')
        self.assertEqual(res.status_code, 200)
        self.assertIn('requirements', res.data)
        self.assertFalse(res.data['can_claim'])
        self.assertFalse(res.data['requirements']['lessons']['completed'])
        self.assertFalse(res.data['requirements']['quiz']['passed'])
        self.assertFalse(res.data['requirements']['project']['submitted'])