from django.test import TestCase

# Create your tests here.
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from courses.models import Course
from subscriptions.models import Plan, Subscription
from .models import Quiz, Question, Choice

User = get_user_model()


class AssessmentsTests(APITestCase):
    def setUp(self):
        self.instructor = User.objects.create_user(
            username="quizinstructor", email="quizinstructor@example.com",
            password="Pass123!", role="INSTRUCTOR",
        )
        self.student = User.objects.create_user(
            username="quizstudent", email="quizstudent@example.com",
            password="Pass123!", role="STUDENT",
        )

        # Give the student an active subscription so they can access quizzes
        plan = Plan.objects.create(name="Test Plan", price=99, duration_days=30, is_active=True)
        Subscription.objects.create(
            student=self.student, plan=plan, status="ACTIVE", amount_paid=plan.price,
        )

        self.course = Course.objects.create(
            title="Quiz Course", stream="CS", level="BEGINNER", instructor=self.instructor,
        )
        self.quiz = Quiz.objects.create(
            course=self.course, title="Test Quiz", pass_percentage=50, created_by=self.instructor,
        )
        self.question = Question.objects.create(quiz=self.quiz, text="2 + 2 = ?", marks=1)
        self.correct_choice = Choice.objects.create(question=self.question, text="4", is_correct=True)
        self.wrong_choice = Choice.objects.create(question=self.question, text="5", is_correct=False)

    def test_student_view_hides_correct_answer(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(f'/api/assessments/{self.quiz.id}/take/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        choice_data = response.data['questions'][0]['choices'][0]
        self.assertNotIn('is_correct', choice_data)

    def test_correct_answer_scores_full_marks(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            f'/api/assessments/{self.quiz.id}/submit/',
            {"answers": [{"question_id": self.question.id, "choice_id": self.correct_choice.id}]},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['percentage'], 100.0)
        self.assertTrue(response.data['passed'])

    def test_wrong_answer_scores_zero(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            f'/api/assessments/{self.quiz.id}/submit/',
            {"answers": [{"question_id": self.question.id, "choice_id": self.wrong_choice.id}]},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['percentage'], 0.0)
        self.assertFalse(response.data['passed'])

    def test_unsubscribed_student_cannot_take_quiz(self):
        unsubscribed_student = User.objects.create_user(
            username="nosub_quizstudent", email="nosub_quiz@example.com",
            password="Pass123!", role="STUDENT",
        )
        self.client.force_authenticate(user=unsubscribed_student)
        response = self.client.get(f'/api/assessments/{self.quiz.id}/take/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)