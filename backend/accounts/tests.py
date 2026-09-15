from django.test import TestCase

# Create your tests here.
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()


class AccountsTests(APITestCase):
    def setUp(self):
        self.register_url = '/api/accounts/register/'
        self.login_url = '/api/accounts/login/'
        self.profile_url = '/api/accounts/profile/'

    def test_register_creates_user(self):
        data = {
            "username": "testuser1",
            "email": "testuser1@example.com",
            "mobile_number": "9000000001",
            "role": "STUDENT",
            "password": "TestPass123!",
            "password2": "TestPass123!",
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username="testuser1").exists())

    def test_register_fails_with_mismatched_passwords(self):
        data = {
            "username": "testuser2",
            "email": "testuser2@example.com",
            "mobile_number": "9000000002",
            "role": "STUDENT",
            "password": "TestPass123!",
            "password2": "DifferentPass!",
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_fails_with_duplicate_email(self):
        User.objects.create_user(username="existing", email="dup@example.com", password="Pass123!", role="STUDENT")
        data = {
            "username": "newuser",
            "email": "dup@example.com",
            "mobile_number": "9000000003",
            "role": "STUDENT",
            "password": "TestPass123!",
            "password2": "TestPass123!",
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_returns_tokens_and_role(self):
        User.objects.create_user(username="loginuser", email="login@example.com", password="Pass123!", role="STUDENT")
        response = self.client.post(self.login_url, {"username": "loginuser", "password": "Pass123!"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["role"], "STUDENT")

    def test_login_fails_with_wrong_password(self):
        User.objects.create_user(username="loginuser2", email="login2@example.com", password="Pass123!", role="STUDENT")
        response = self.client.post(self.login_url, {"username": "loginuser2", "password": "WrongPass!"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_requires_authentication(self):
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_returns_correct_user_data(self):
        user = User.objects.create_user(username="profileuser", email="profile@example.com", password="Pass123!", role="STUDENT")
        self.client.force_authenticate(user=user)
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "profileuser")