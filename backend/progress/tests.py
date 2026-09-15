from django.test import TestCase

# Create your tests here.
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from courses.models import Course, Lesson
from .models import LessonProgress, CourseProgress

User = get_user_model()


class ProgressTests(APITestCase):
    def setUp(self):
        self.instructor = User.objects.create_user(
            username="proginstructor", email="proginstructor@example.com",
            password="Pass123!", role="INSTRUCTOR",
        )
        self.student = User.objects.create_user(
            username="progstudent", email="progstudent@example.com",
            password="Pass123!", role="STUDENT",
        )
        self.course = Course.objects.create(
            title="Progress Course", stream="CS", level="BEGINNER",
            instructor=self.instructor,
        )
        self.lesson1 = Lesson.objects.create(course=self.course, title="Lesson 1", order=1)
        self.lesson2 = Lesson.objects.create(course=self.course, title="Lesson 2", order=2)
        self.update_url = '/api/progress/update/'

    def test_update_progress_requires_auth(self):
        response = self.client.post(self.update_url, {"lesson_id": self.lesson1.id, "is_completed": True})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_mark_lesson_complete_creates_progress(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(self.update_url, {"lesson_id": self.lesson1.id, "is_completed": True})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(LessonProgress.objects.filter(student=self.student, lesson=self.lesson1, is_completed=True).exists())

    def test_course_progress_recalculates_correctly(self):
        self.client.force_authenticate(user=self.student)
        self.client.post(self.update_url, {"lesson_id": self.lesson1.id, "is_completed": True})
        course_progress = CourseProgress.objects.get(student=self.student, course=self.course)
        self.assertEqual(course_progress.completed_lessons, 1)
        self.assertEqual(course_progress.total_lessons, 2)
        self.assertEqual(course_progress.progress_percent, 50.0)
        self.assertFalse(course_progress.is_course_completed)

    def test_course_marked_completed_when_all_lessons_done(self):
        self.client.force_authenticate(user=self.student)
        self.client.post(self.update_url, {"lesson_id": self.lesson1.id, "is_completed": True})
        self.client.post(self.update_url, {"lesson_id": self.lesson2.id, "is_completed": True})
        course_progress = CourseProgress.objects.get(student=self.student, course=self.course)
        self.assertTrue(course_progress.is_course_completed)
        self.assertEqual(course_progress.progress_percent, 100.0)