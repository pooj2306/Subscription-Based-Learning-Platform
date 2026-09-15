from django.test import TestCase

# Create your tests here.
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Course, Lesson

User = get_user_model()


class CoursesTests(APITestCase):
    def setUp(self):
        self.instructor = User.objects.create_user(
            username="instructor1", email="instructor1@example.com",
            password="Pass123!", role="INSTRUCTOR",
        )
        self.other_instructor = User.objects.create_user(
            username="instructor2", email="instructor2@example.com",
            password="Pass123!", role="INSTRUCTOR",
        )
        self.student = User.objects.create_user(
            username="student1", email="student1@example.com",
            password="Pass123!", role="STUDENT",
        )
        self.course = Course.objects.create(
            title="Test Course", stream="CS", level="BEGINNER",
            instructor=self.instructor, is_published=True,
        )
        self.list_url = '/api/courses/'
        self.detail_url = f'/api/courses/{self.course.id}/'

    def test_anyone_can_list_courses(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_student_cannot_create_course(self):
        self.client.force_authenticate(user=self.student)
        data = {"title": "New Course", "stream": "CS", "level": "BEGINNER"}
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_instructor_can_create_course(self):
        self.client.force_authenticate(user=self.instructor)
        data = {"title": "New Course", "stream": "CS", "level": "BEGINNER"}
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["instructor"], self.instructor.id) if "instructor" in response.data else None

    def test_instructor_cannot_edit_others_course(self):
        self.client.force_authenticate(user=self.other_instructor)
        response = self.client.patch(self.detail_url, {"title": "Hacked Title"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_instructor_can_edit_own_course(self):
        self.client.force_authenticate(user=self.instructor)
        response = self.client.patch(self.detail_url, {"title": "Updated Title"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.course.refresh_from_db()
        self.assertEqual(self.course.title, "Updated Title")