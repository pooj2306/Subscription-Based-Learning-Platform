from django.test import TestCase

# Create your tests here.
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from .models import Plan, Subscription

User = get_user_model()


class SubscriptionsTests(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            username="substudent", email="substudent@example.com",
            password="Pass123!", role="STUDENT",
        )
        self.plan = Plan.objects.create(name="Test Plan", price=99, duration_days=30, is_active=True)
        self.plans_url = '/api/subscriptions/plans/'
        self.subscribe_url = '/api/subscriptions/subscribe/'
        self.my_subs_url = '/api/subscriptions/my/'

    def test_anyone_can_view_plans(self):
        response = self.client.get(self.plans_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_student_subscribe_creates_active_subscription(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(self.subscribe_url, {"plan_id": self.plan.id})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "ACTIVE")
        sub = Subscription.objects.get(student=self.student, plan=self.plan)
        self.assertEqual(sub.status, "ACTIVE")
        self.assertTrue(sub.is_active)

    def test_subscribe_fails_with_invalid_plan(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(self.subscribe_url, {"plan_id": 9999})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_my_subscriptions_requires_auth(self):
        response = self.client.get(self.my_subs_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_subscription_end_date_auto_calculated(self):
        sub = Subscription.objects.create(
            student=self.student, plan=self.plan, amount_paid=self.plan.price,
        )
        expected_end = sub.start_date + timedelta(days=self.plan.duration_days)
        self.assertEqual(sub.end_date.date(), expected_end.date())

    def test_expired_subscription_is_not_active(self):
        sub = Subscription.objects.create(
            student=self.student, plan=self.plan, amount_paid=self.plan.price,
            start_date=timezone.now() - timedelta(days=40),
        )
        self.assertFalse(sub.is_active)