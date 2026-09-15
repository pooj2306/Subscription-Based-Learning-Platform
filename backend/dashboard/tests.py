from django.test import TestCase

# Create your tests here.
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()


class DashboardTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="dashadmin", email="dashadmin@example.com",
            password="Pass123!", role="ADMIN",
        )
        self.student = User.objects.create_user(
            username="dashstudent", email="dashstudent@example.com",
            password="Pass123!", role="STUDENT",
        )
        self.overview_url = '/api/dashboard/overview/'

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