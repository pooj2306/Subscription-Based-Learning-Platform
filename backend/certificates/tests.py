from django.test import TestCase

# Create your tests here.
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from courses.models import Course, Lesson
from progress.models import CourseProgress
from .models import Certificate

User = get_user_model()


class CertificatesTests(APITestCase):
    def setUp(self):
        self.instructor = User.objects.create_user(
            username="certinstructor", email="certinstructor@example.com",
            password="Pass123!", role="INSTRUCTOR",
        )
        self.student = User.objects.create_user(
            username="certstudent", email="certstudent@example.com",
            password="Pass123!", role="STUDENT",
        )
        self.course = Course.objects.create(
            title="Cert Course", stream="CS", level="BEGINNER", instructor=self.instructor,
        )
        self.request_url = f'/api/certificates/request/{self.course.id}/'

    def test_certificate_blocked_if_course_not_started(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(self.request_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_certificate_blocked_if_course_incomplete(self):
        CourseProgress.objects.create(
            student=self.student, course=self.course,
            total_lessons=2, completed_lessons=1, is_course_completed=False,
        )
        self.client.force_authenticate(user=self.student)
        response = self.client.post(self.request_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_certificate_issued_when_course_completed(self):
        CourseProgress.objects.create(
            student=self.student, course=self.course,
            total_lessons=2, completed_lessons=2, is_course_completed=True,
        )
        self.client.force_authenticate(user=self.student)
        response = self.client.post(self.request_url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Certificate.objects.filter(student=self.student, course=self.course).exists())

    def test_certificate_number_is_unique_and_auto_generated(self):
        CourseProgress.objects.create(
            student=self.student, course=self.course,
            total_lessons=1, completed_lessons=1, is_course_completed=True,
        )
        cert = Certificate.objects.create(student=self.student, course=self.course)
        self.assertTrue(cert.certificate_number.startswith("SBLP-"))