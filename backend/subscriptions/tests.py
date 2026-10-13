from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from .models import Plan, Subscription, CoursePurchase, StudentVerification
from courses.models import Course, Lesson
from adaptive_learning.models import Topic, StudentTopicScore
from progress.models import CourseProgress, LessonProgress

User = get_user_model()


class SubscriptionsTests(APITestCase):
    def setUp(self):
        self.instructor = User.objects.create_user(
            username="instructor1", email="inst@example.com",
            password="Pass123!", role="INSTRUCTOR",
        )
        self.student = User.objects.create_user(
            username="substudent", email="substudent@example.com",
            password="Pass123!", role="STUDENT",
        )
        self.plan = Plan.objects.create(
            name="Standard Plan", price=199, duration_days=30,
            plan_type=Plan.PlanType.STANDARD, is_active=True,
        )
        self.trial_plan = Plan.objects.create(
            name="7-Day Trial", price=0, duration_days=7,
            plan_type=Plan.PlanType.TRIAL, is_active=True,
        )
        self.course = Course.objects.create(
            title="Advanced Algorithms",
            description="Deep dive into algorithms and recursion.",
            stream="Computer Science",
            instructor=self.instructor,
            is_published=True,
            requires_subscription=True,
            is_premium=True,
            price=499.00,
        )
        self.topic = Topic.objects.create(
            name="Recursion & Backtracking",
            course=self.course,
        )

    def test_view_plans(self):
        response = self.client.get('/api/subscriptions/plans/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) >= 2)

    def test_student_subscribe(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post('/api/subscriptions/subscribe/', {"plan_id": self.plan.id})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "ACTIVE")

    def test_pause_and_resume_subscription(self):
        self.client.force_authenticate(user=self.student)
        sub = Subscription.objects.create(
            student=self.student, plan=self.plan,
            status=Subscription.Status.ACTIVE,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=20),
            amount_paid=199,
        )
        # Pause
        pause_resp = self.client.post(f'/api/subscriptions/{sub.id}/pause/')
        self.assertEqual(pause_resp.status_code, status.HTTP_200_OK)
        sub.refresh_from_db()
        self.assertEqual(sub.status, Subscription.Status.PAUSED)
        self.assertFalse(sub.is_active)
        self.assertGreaterEqual(sub.remaining_days_at_pause, 19)

        # Resume
        resume_resp = self.client.post(f'/api/subscriptions/{sub.id}/resume/')
        self.assertEqual(resume_resp.status_code, status.HTTP_200_OK)
        sub.refresh_from_db()
        self.assertEqual(sub.status, Subscription.Status.ACTIVE)
        self.assertTrue(sub.is_active)
        self.assertEqual(sub.remaining_days_at_pause, 0)

    def test_cancel_subscription_with_progress_carryover(self):
        self.client.force_authenticate(user=self.student)
        sub = Subscription.objects.create(
            student=self.student, plan=self.plan,
            status=Subscription.Status.ACTIVE, amount_paid=199,
        )
        resp = self.client.post(f'/api/subscriptions/{sub.id}/cancel/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("progress_carryover", resp.data)
        sub.refresh_from_db()
        self.assertEqual(sub.status, Subscription.Status.CANCELLED)

    def test_start_free_trial_and_prevent_duplicate(self):
        self.client.force_authenticate(user=self.student)
        # 1st trial activation -> OK
        resp = self.client.post('/api/subscriptions/start-trial/')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(resp.data['subscription']['is_trial'])

        # 2nd trial activation -> rejected
        resp2 = self.client.post('/api/subscriptions/start-trial/')
        self.assertEqual(resp2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(resp2.data.get('trial_used'))

    def test_progress_carryover_summary(self):
        self.client.force_authenticate(user=self.student)
        resp = self.client.get('/api/subscriptions/progress-carryover/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("guarantee_title", resp.data)
        self.assertIn("stats", resp.data)

    def test_purchase_course_pay_per_course(self):
        self.client.force_authenticate(user=self.student)
        resp = self.client.post('/api/subscriptions/purchase-course/', {"course_id": self.course.id})
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(CoursePurchase.objects.filter(student=self.student, course=self.course).exists())

        # List purchased courses
        list_resp = self.client.get('/api/subscriptions/purchased-courses/')
        self.assertEqual(list_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_resp.data), 1)

    def test_student_verification_unlocks_discount(self):
        self.client.force_authenticate(user=self.student)
        verify_data = {
            "institution_name": "MIT Institute of Tech",
            "student_id_number": "MIT-9921",
            "student_email": "substudent@mit.edu",
        }
        resp = self.client.post('/api/subscriptions/student-verification/', verify_data)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.data["is_verified"])

        # Check plan effective price with student discount
        plans_resp = self.client.get('/api/subscriptions/plans/')
        std_plan = next(p for p in plans_resp.data if p['id'] == self.plan.id)
        # 199 with 50% discount = 99.5
        self.assertEqual(std_plan['effective_price'], 99.5)

    def test_smart_upsell_recommends_course_for_weak_topic(self):
        self.client.force_authenticate(user=self.student)
        # Create a weak topic score
        StudentTopicScore.objects.create(
            student=self.student,
            topic=self.topic,
            total_attempted=10,
            total_correct=2,  # 20% -> weak
        )
        resp = self.client.get('/api/subscriptions/smart-upsell/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.data['is_personalized'])
        self.assertIn("Recursion & Backtracking", resp.data['headline'])
        self.assertEqual(resp.data['recommended_course']['id'], self.course.id)

    def test_paused_subscription_stops_owned_course_access(self):
        self.client.force_authenticate(user=self.student)

        # 1. Student purchases the course (standalone ownership)
        CoursePurchase.objects.create(
            student=self.student,
            course=self.course,
            amount_paid=499.00,
        )
        Lesson.objects.create(
            course=self.course,
            title="Lesson 1: Intro to Recursion",
            duration_minutes=15,
            order=1,
        )

        # 2. Initially with no subscription, student has access because of course purchase
        detail_resp = self.client.get(f'/api/courses/{self.course.id}/')
        self.assertEqual(detail_resp.status_code, status.HTTP_200_OK)
        self.assertTrue(detail_resp.data['has_access'])
        self.assertTrue(detail_resp.data['is_purchased'])
        self.assertFalse(detail_resp.data['is_subscription_paused'])

        lessons_resp = self.client.get(f'/api/courses/{self.course.id}/lessons/')
        self.assertEqual(lessons_resp.status_code, status.HTTP_200_OK)

        # 3. Student has an active subscription
        sub = Subscription.objects.create(
            student=self.student,
            plan=self.plan,
            status=Subscription.Status.ACTIVE,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30),
            amount_paid=199,
        )

        # 4. Student pauses subscription
        pause_resp = self.client.post(f'/api/subscriptions/{sub.id}/pause/')
        self.assertEqual(pause_resp.status_code, status.HTTP_200_OK)
        sub.refresh_from_db()
        self.assertEqual(sub.status, Subscription.Status.PAUSED)

        # 5. Access to the owned course is now stopped while subscription is paused
        detail_resp2 = self.client.get(f'/api/courses/{self.course.id}/')
        self.assertEqual(detail_resp2.status_code, status.HTTP_200_OK)
        self.assertFalse(detail_resp2.data['has_access'])
        self.assertTrue(detail_resp2.data['is_purchased'])
        self.assertTrue(detail_resp2.data['is_subscription_paused'])

        lessons_resp2 = self.client.get(f'/api/courses/{self.course.id}/lessons/')
        self.assertEqual(lessons_resp2.status_code, status.HTTP_403_FORBIDDEN)

        # 6. Student resumes subscription
        resume_resp = self.client.post(f'/api/subscriptions/{sub.id}/resume/')
        self.assertEqual(resume_resp.status_code, status.HTTP_200_OK)

        # 7. Access is restored
        detail_resp3 = self.client.get(f'/api/courses/{self.course.id}/')
        self.assertEqual(detail_resp3.status_code, status.HTTP_200_OK)
        self.assertTrue(detail_resp3.data['has_access'])
        self.assertFalse(detail_resp3.data['is_subscription_paused'])

        lessons_resp3 = self.client.get(f'/api/courses/{self.course.id}/lessons/')
        self.assertEqual(lessons_resp3.status_code, status.HTTP_200_OK)