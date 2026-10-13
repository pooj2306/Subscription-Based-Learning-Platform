from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from datetime import timedelta
from django.utils import timezone

from assessments.models import Quiz, Question, Choice
from courses.models import Course
from .models import (
    Topic, AdaptiveQuestion, StudentDifficultyLevel,
    StudentTopicScore, SpacedRepetitionCard,
)
from .services import record_question_outcome, adjust_difficulty_for_answer

User = get_user_model()


class AdaptiveDifficultyTests(TestCase):
    def setUp(self):
        self.instructor = User.objects.create_user(
            username='inst', password='pass', role='INSTRUCTOR', email='i@test.com',
        )
        self.student = User.objects.create_user(
            username='stu', password='pass', role='STUDENT', email='s@test.com',
        )
        self.course = Course.objects.create(
            title='Test Course', instructor=self.instructor,
        )
        self.quiz = Quiz.objects.create(
            course=self.course, title='Adaptive Quiz', created_by=self.instructor,
        )

    def test_level_up_after_3_correct(self):
        dl = StudentDifficultyLevel.objects.create(
            student=self.student, quiz=self.quiz, current_level=1,
        )
        for _ in range(3):
            dl.adjust(True)
        self.assertEqual(dl.current_level, 2)

    def test_level_down_after_2_wrong(self):
        dl = StudentDifficultyLevel.objects.create(
            student=self.student, quiz=self.quiz, current_level=2,
        )
        for _ in range(2):
            dl.adjust(False)
        self.assertEqual(dl.current_level, 1)

    def test_level_does_not_go_below_1(self):
        dl = StudentDifficultyLevel.objects.create(
            student=self.student, quiz=self.quiz, current_level=1,
        )
        for _ in range(5):
            dl.adjust(False)
        self.assertEqual(dl.current_level, 1)

    def test_level_does_not_go_above_3(self):
        dl = StudentDifficultyLevel.objects.create(
            student=self.student, quiz=self.quiz, current_level=3,
        )
        for _ in range(10):
            dl.adjust(True)
        self.assertEqual(dl.current_level, 3)

    def test_adjust_difficulty_helper(self):
        old_lvl, new_lvl, changed, cons_c, cons_w = adjust_difficulty_for_answer(
            self.student, self.quiz, True,
        )
        self.assertEqual(old_lvl, 1)
        self.assertEqual(new_lvl, 1)
        self.assertEqual(cons_c, 1)

        adjust_difficulty_for_answer(self.student, self.quiz, True)
        old_lvl, new_lvl, changed, cons_c, cons_w = adjust_difficulty_for_answer(
            self.student, self.quiz, True,
        )
        self.assertTrue(changed)
        self.assertEqual(new_lvl, 2)


class TopicScoreTests(TestCase):
    def setUp(self):
        self.instructor = User.objects.create_user(
            username='inst', password='pass', role='INSTRUCTOR', email='i@test.com',
        )
        self.student = User.objects.create_user(
            username='stu', password='pass', role='STUDENT', email='s@test.com',
        )
        self.course = Course.objects.create(
            title='Test Course', instructor=self.instructor,
        )
        self.topic = Topic.objects.create(name='Arrays', course=self.course)

    def test_accuracy_calculation(self):
        ts = StudentTopicScore.objects.create(
            student=self.student, topic=self.topic,
            total_attempted=10, total_correct=8,
        )
        self.assertEqual(ts.accuracy, 80.0)

    def test_strength_labels(self):
        strong = StudentTopicScore(total_attempted=10, total_correct=9)
        self.assertEqual(strong.strength_label, 'strong')
        avg = StudentTopicScore(total_attempted=10, total_correct=6)
        self.assertEqual(avg.strength_label, 'average')
        weak = StudentTopicScore(total_attempted=10, total_correct=3)
        self.assertEqual(weak.strength_label, 'weak')


class SpacedRepetitionTests(TestCase):
    def setUp(self):
        self.instructor = User.objects.create_user(
            username='inst', password='pass', role='INSTRUCTOR', email='i@test.com',
        )
        self.student = User.objects.create_user(
            username='stu', password='pass', role='STUDENT', email='s@test.com',
        )
        self.course = Course.objects.create(
            title='Test Course', instructor=self.instructor,
        )
        self.quiz = Quiz.objects.create(
            course=self.course, title='Quiz', created_by=self.instructor,
        )
        self.question = Question.objects.create(
            quiz=self.quiz, text='What is 2+2?', marks=1,
        )

    def test_card_advances_on_correct(self):
        card = SpacedRepetitionCard.objects.create(
            student=self.student, question=self.question,
        )
        card.record_review(True)
        self.assertEqual(card.interval_index, 1)

    def test_card_resets_on_wrong(self):
        card = SpacedRepetitionCard.objects.create(
            student=self.student, question=self.question,
            interval_index=3,
        )
        card.record_review(False)
        self.assertEqual(card.interval_index, 0)

    def test_card_retires_at_max(self):
        card = SpacedRepetitionCard.objects.create(
            student=self.student, question=self.question,
            interval_index=4,  # last index
        )
        card.record_review(True)
        self.assertTrue(card.is_retired)

    def test_record_question_outcome_creates_card_on_wrong(self):
        record_question_outcome(self.student, self.question, False)
        card = SpacedRepetitionCard.objects.filter(student=self.student, question=self.question).first()
        self.assertIsNotNone(card)
        self.assertEqual(card.interval_index, 0)
        self.assertFalse(card.is_retired)


class AdaptiveLearningApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.instructor = User.objects.create_user(
            username='inst_api', password='pass123', role='INSTRUCTOR', email='inst_api@test.com',
        )
        self.student = User.objects.create_user(
            username='stu_api', password='pass123', role='STUDENT', email='stu_api@test.com',
        )
        self.course = Course.objects.create(
            title='Algorithms 101', instructor=self.instructor,
        )
        self.quiz = Quiz.objects.create(
            course=self.course, title='Algo Quiz', created_by=self.instructor, pass_percentage=50,
        )
        self.topic_arr = Topic.objects.create(name='Arrays', course=self.course)
        self.topic_rec = Topic.objects.create(name='Recursion', course=self.course)

        # Create questions
        self.q1 = Question.objects.create(quiz=self.quiz, text='Array Q1', marks=1)
        AdaptiveQuestion.objects.create(question=self.q1, difficulty=1, topic=self.topic_arr)
        self.c1_corr = Choice.objects.create(question=self.q1, text='Correct 1', is_correct=True)
        self.c1_inc = Choice.objects.create(question=self.q1, text='Wrong 1', is_correct=False)

        self.q2 = Question.objects.create(quiz=self.quiz, text='Recursion Q2', marks=2)
        AdaptiveQuestion.objects.create(question=self.q2, difficulty=2, topic=self.topic_rec)
        self.c2_corr = Choice.objects.create(question=self.q2, text='Correct 2', is_correct=True)
        self.c2_inc = Choice.objects.create(question=self.q2, text='Wrong 2', is_correct=False)

    def test_topic_strengths_dashboard_headline(self):
        # Arrays: strong, Recursion: weak
        StudentTopicScore.objects.create(student=self.student, topic=self.topic_arr, total_attempted=10, total_correct=9)
        StudentTopicScore.objects.create(student=self.student, topic=self.topic_rec, total_attempted=10, total_correct=2)

        self.client.force_authenticate(user=self.student)
        res = self.client.get('/api/adaptive/strengths/')
        self.assertEqual(res.status_code, 200)
        self.assertIn("strong in Arrays", res.data['headline'])
        self.assertIn("weak in Recursion", res.data['headline'])
        self.assertEqual(res.data['summary']['strong'], 1)
        self.assertEqual(res.data['summary']['weak'], 1)

    def test_interactive_adaptive_flow(self):
        self.client.force_authenticate(user=self.student)

        # Start interactive session
        res_start = self.client.post(f'/api/adaptive/quiz/{self.quiz.id}/interactive/start/')
        self.assertEqual(res_start.status_code, 200)
        self.assertEqual(res_start.data['current_level'], 1)
        self.assertIn('question', res_start.data)

        # Answer question correctly
        res_ans = self.client.post(f'/api/adaptive/quiz/{self.quiz.id}/interactive/answer/', {
            'question_id': self.q1.id,
            'choice_id': self.c1_corr.id,
            'session_history': [],
        }, format='json')
        self.assertEqual(res_ans.status_code, 200)
        self.assertTrue(res_ans.data['is_correct'])

    def test_simulate_spaced_days(self):
        # Create a card with next_review_date = today + 3 days
        card = SpacedRepetitionCard.objects.create(
            student=self.student,
            question=self.q1,
            next_review_date=timezone.now().date() + timedelta(days=3),
        )
        self.client.force_authenticate(user=self.student)
        res = self.client.post('/api/adaptive/spaced/simulate-days/', {'days': 3}, format='json')
        self.assertEqual(res.status_code, 200)
        card.refresh_from_db()
        self.assertTrue(card.is_due)
