from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
import random

from assessments.models import Quiz, Question, Choice, QuizAttempt, StudentAnswer
from .models import (
    Topic, AdaptiveQuestion, StudentDifficultyLevel,
    StudentTopicScore, SpacedRepetitionCard,
)
from .serializers import (
    TopicSerializer, AdaptiveQuestionSerializer,
    StudentDifficultyLevelSerializer, StudentTopicScoreSerializer,
    SpacedRepetitionCardSerializer, AdaptiveQuizSubmitSerializer,
    SpacedReviewSubmitSerializer, AdaptiveQuestionStudentViewSerializer,
    QuestionWithAdaptiveMetaSerializer, InteractiveAnswerSubmitSerializer,
    PracticeQuizSubmitSerializer, SimulateDaysSerializer,
)
from .services import record_question_outcome, adjust_difficulty_for_answer


# ──────────────────────────────────────────────
# 1. Topic Management (Instructor / Course)
# ──────────────────────────────────────────────

class TopicListCreateView(generics.ListCreateAPIView):
    serializer_class = TopicSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        course_id = self.kwargs.get('course_id')
        if course_id:
            return Topic.objects.filter(course_id=course_id)
        return Topic.objects.all()

    def perform_create(self, serializer):
        course_id = self.kwargs.get('course_id')
        if course_id:
            serializer.save(course_id=course_id)
        else:
            serializer.save()


# ──────────────────────────────────────────────
# 2. Adaptive Question Metadata & Tagging
# ──────────────────────────────────────────────

class AdaptiveQuestionDetailView(generics.RetrieveUpdateAPIView):
    """Set / update difficulty & topic for a question (instructor)."""
    serializer_class = AdaptiveQuestionSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'question_id'
    lookup_url_kwarg = 'question_id'

    def get_queryset(self):
        return AdaptiveQuestion.objects.all()

    def get_object(self):
        question_id = self.kwargs['question_id']
        obj, _ = AdaptiveQuestion.objects.get_or_create(
            question_id=question_id,
            defaults={'difficulty': 2},
        )
        return obj


class BulkSetAdaptiveMetaView(APIView):
    """Bulk set difficulty + topic for multiple questions."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        items = request.data.get('questions', [])
        updated = []
        for item in items:
            q_id = item.get('question_id')
            if not q_id:
                continue
            defaults = {}
            if 'difficulty' in item:
                defaults['difficulty'] = item['difficulty']
            if 'topic_id' in item:
                defaults['topic_id'] = item['topic_id']
            obj, _ = AdaptiveQuestion.objects.update_or_create(
                question_id=q_id,
                defaults=defaults,
            )
            updated.append(obj.id)
        return Response({'updated_count': len(updated)}, status=status.HTTP_200_OK)


class InstructorQuizQuestionsView(APIView):
    """Returns all questions of a quiz with their difficulty and topic metadata."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, quiz_id):
        quiz = get_object_or_404(Quiz, pk=quiz_id)
        questions = quiz.questions.all().prefetch_related('choices', 'adaptive_meta__topic')
        serializer = QuestionWithAdaptiveMetaSerializer(questions, many=True)
        return Response({
            'quiz_id': quiz.id,
            'quiz_title': quiz.title,
            'course_id': quiz.course_id,
            'questions': serializer.data,
        })


# ──────────────────────────────────────────────
# 3. Adaptive Quiz (Batch Mode)
# ──────────────────────────────────────────────

class AdaptiveQuizView(APIView):
    """
    Returns questions filtered to the student's current difficulty level.
    If there aren't enough at that level, pads from adjacent levels.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, quiz_id):
        quiz = get_object_or_404(Quiz, pk=quiz_id)
        student = request.user

        level_obj, _ = StudentDifficultyLevel.objects.get_or_create(
            student=student, quiz=quiz,
            defaults={'current_level': 1},
        )

        # Try questions at current level first
        questions = list(Question.objects.filter(
            quiz=quiz,
            adaptive_meta__difficulty=level_obj.current_level,
        ).order_by('?')[:10])

        # Pad if not enough
        if len(questions) < 5:
            existing_ids = [q.id for q in questions]
            fallback = list(Question.objects.filter(quiz=quiz).exclude(
                id__in=existing_ids,
            ).order_by('?')[:10 - len(questions)])
            questions = questions + fallback

        serializer = AdaptiveQuestionStudentViewSerializer(questions, many=True)
        return Response({
            'quiz_id': quiz.id,
            'quiz_title': quiz.title,
            'current_level': level_obj.current_level,
            'level_display': level_obj.get_current_level_display(),
            'consecutive_correct': level_obj.consecutive_correct,
            'consecutive_wrong': level_obj.consecutive_wrong,
            'questions': serializer.data,
        })


class SubmitAdaptiveQuizView(APIView):
    """
    Grade answers in batch, update difficulty level, update topic scores,
    create spaced-repetition cards for wrong answers.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, quiz_id):
        quiz = get_object_or_404(Quiz, pk=quiz_id)
        student = request.user
        serializer = AdaptiveQuizSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        answers_data = serializer.validated_data['answers']

        attempt = QuizAttempt.objects.create(student=student, quiz=quiz)

        level_obj, _ = StudentDifficultyLevel.objects.get_or_create(
            student=student, quiz=quiz,
            defaults={'current_level': 1},
        )

        total_marks = 0
        score = 0
        results = []

        for ans in answers_data:
            try:
                question = Question.objects.get(id=ans['question_id'], quiz=quiz)
            except Question.DoesNotExist:
                continue

            total_marks += question.marks

            try:
                selected_choice = Choice.objects.get(
                    id=ans['choice_id'], question=question,
                )
            except Choice.DoesNotExist:
                continue

            is_correct = selected_choice.is_correct

            StudentAnswer.objects.create(
                attempt=attempt,
                question=question,
                selected_choice=selected_choice,
                is_correct=is_correct,
            )

            # 1. Adjust difficulty
            level_obj.adjust(is_correct)

            # 2. Update topic score & spaced repetition
            record_question_outcome(student, question, is_correct)

            if is_correct:
                score += question.marks

            correct_choice = question.choices.filter(is_correct=True).first()
            results.append({
                'question_id': question.id,
                'question_text': question.text,
                'selected_choice': selected_choice.text,
                'correct_choice': correct_choice.text if correct_choice else '',
                'is_correct': is_correct,
            })

        percentage = round((score / total_marks) * 100, 2) if total_marks > 0 else 0
        passed = percentage >= quiz.pass_percentage

        attempt.score = score
        attempt.total_marks = total_marks
        attempt.percentage = percentage
        attempt.passed = passed
        attempt.save()

        return Response({
            'attempt_id': attempt.id,
            'score': score,
            'total_marks': total_marks,
            'percentage': percentage,
            'passed': passed,
            'current_level': level_obj.current_level,
            'level_display': level_obj.get_current_level_display(),
            'consecutive_correct': level_obj.consecutive_correct,
            'consecutive_wrong': level_obj.consecutive_wrong,
            'results': results,
        }, status=status.HTTP_201_CREATED)


# ──────────────────────────────────────────────
# 4. Interactive Real-Time Adaptive Quiz
# ──────────────────────────────────────────────

class InteractiveAdaptiveStartView(APIView):
    """
    Starts an interactive adaptive quiz session.
    Returns the student's current difficulty level, streak,
    and the first question matching their current level.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, quiz_id):
        quiz = get_object_or_404(Quiz, pk=quiz_id)
        student = request.user

        level_obj, _ = StudentDifficultyLevel.objects.get_or_create(
            student=student, quiz=quiz,
            defaults={'current_level': 1},
        )

        # Target session length (e.g., 6 questions)
        total_questions = min(max(quiz.questions.count(), 1), 6)

        # Find first question matching current level
        q = Question.objects.filter(
            quiz=quiz,
            adaptive_meta__difficulty=level_obj.current_level,
        ).order_by('?').first()

        if not q:
            # Fallback to any question in quiz
            q = Question.objects.filter(quiz=quiz).order_by('?').first()

        if not q:
            return Response(
                {'error': 'No questions found for this quiz.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AdaptiveQuestionStudentViewSerializer(q)
        return Response({
            'quiz_id': quiz.id,
            'quiz_title': quiz.title,
            'current_level': level_obj.current_level,
            'level_display': level_obj.get_current_level_display(),
            'consecutive_correct': level_obj.consecutive_correct,
            'consecutive_wrong': level_obj.consecutive_wrong,
            'question_number': 1,
            'total_questions': total_questions,
            'question': serializer.data,
        })


class InteractiveAdaptiveAnswerView(APIView):
    """
    Submits an answer for the CURRENT question in an interactive adaptive session.
    Dynamically adjusts difficulty:
      - 3 correct in a row -> level up (max 3: Hard)
      - 2 wrong in a row -> level down (min 1: Easy)
    Updates topic score & spaced repetition.
    Picks the NEXT question matching the NEW level, or finishes if session is done.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, quiz_id):
        quiz = get_object_or_404(Quiz, pk=quiz_id)
        student = request.user
        serializer = InteractiveAnswerSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        question_id = serializer.validated_data['question_id']
        choice_id = serializer.validated_data['choice_id']
        session_history = serializer.validated_data.get('session_history', [])

        question = get_object_or_404(Question, id=question_id, quiz=quiz)
        choice = get_object_or_404(Choice, id=choice_id, question=question)

        is_correct = choice.is_correct

        # 1. Dynamically adjust difficulty using rule
        old_level, new_level, level_changed, cons_correct, cons_wrong = adjust_difficulty_for_answer(
            student, quiz, is_correct,
        )

        # 2. Record topic outcome and spaced repetition
        record_question_outcome(student, question, is_correct)

        correct_choice = question.choices.filter(is_correct=True).first()

        # Update session history with this question's outcome
        current_entry = {
            'question_id': question.id,
            'question_text': question.text,
            'choice_id': choice.id,
            'selected_choice': choice.text,
            'correct_choice': correct_choice.text if correct_choice else '',
            'is_correct': is_correct,
            'marks': question.marks if is_correct else 0,
            'total_marks': question.marks,
            'level': old_level,
        }
        updated_history = session_history + [current_entry]

        total_target = min(max(quiz.questions.count(), 1), 6)
        answered_ids = [entry['question_id'] for entry in updated_history]

        change_direction = 'up' if new_level > old_level else ('down' if new_level < old_level else 'same')

        level_names = {1: 'Easy', 2: 'Medium', 3: 'Hard'}

        # Check if session is completed
        if len(updated_history) >= total_target or len(answered_ids) >= quiz.questions.count():
            # Create QuizAttempt
            score = sum(e['marks'] for e in updated_history)
            total_marks = sum(e['total_marks'] for e in updated_history)
            percentage = round((score / total_marks * 100), 2) if total_marks > 0 else 0
            passed = percentage >= quiz.pass_percentage

            attempt = QuizAttempt.objects.create(
                student=student,
                quiz=quiz,
                score=score,
                total_marks=total_marks,
                percentage=percentage,
                passed=passed,
            )

            for e in updated_history:
                try:
                    q_obj = Question.objects.get(id=e['question_id'])
                    c_obj = Choice.objects.get(id=e['choice_id'])
                    StudentAnswer.objects.create(
                        attempt=attempt,
                        question=q_obj,
                        selected_choice=c_obj,
                        is_correct=e['is_correct'],
                    )
                except Exception:
                    pass

            return Response({
                'is_completed': True,
                'is_correct': is_correct,
                'selected_choice': choice.text,
                'correct_choice': correct_choice.text if correct_choice else '',
                'old_level': old_level,
                'new_level': new_level,
                'level_changed': level_changed,
                'change_direction': change_direction,
                'level_display': level_names.get(new_level, 'Medium'),
                'consecutive_correct': cons_correct,
                'consecutive_wrong': cons_wrong,
                'attempt_id': attempt.id,
                'score': score,
                'total_marks': total_marks,
                'percentage': percentage,
                'passed': passed,
                'session_history': updated_history,
                'results': updated_history,
            })

        # Not finished: pick NEXT question matching NEW difficulty level
        next_q = Question.objects.filter(
            quiz=quiz,
            adaptive_meta__difficulty=new_level,
        ).exclude(id__in=answered_ids).order_by('?').first()

        # If none at exact level, search adjacent levels
        if not next_q:
            next_q = Question.objects.filter(
                quiz=quiz,
            ).exclude(id__in=answered_ids).order_by('?').first()

        if not next_q:
            # No more questions available, finalize early
            score = sum(e['marks'] for e in updated_history)
            total_marks = sum(e['total_marks'] for e in updated_history)
            percentage = round((score / total_marks * 100), 2) if total_marks > 0 else 0
            passed = percentage >= quiz.pass_percentage
            attempt = QuizAttempt.objects.create(
                student=student, quiz=quiz, score=score, total_marks=total_marks,
                percentage=percentage, passed=passed,
            )
            return Response({
                'is_completed': True,
                'is_correct': is_correct,
                'selected_choice': choice.text,
                'correct_choice': correct_choice.text if correct_choice else '',
                'old_level': old_level,
                'new_level': new_level,
                'level_changed': level_changed,
                'change_direction': change_direction,
                'level_display': level_names.get(new_level, 'Medium'),
                'attempt_id': attempt.id,
                'score': score,
                'total_marks': total_marks,
                'percentage': percentage,
                'passed': passed,
                'results': updated_history,
            })

        next_q_serialized = AdaptiveQuestionStudentViewSerializer(next_q).data

        return Response({
            'is_completed': False,
            'is_correct': is_correct,
            'selected_choice': choice.text,
            'correct_choice': correct_choice.text if correct_choice else '',
            'old_level': old_level,
            'new_level': new_level,
            'level_changed': level_changed,
            'change_direction': change_direction,
            'level_display': level_names.get(new_level, 'Medium'),
            'consecutive_correct': cons_correct,
            'consecutive_wrong': cons_wrong,
            'question_number': len(updated_history) + 1,
            'total_questions': total_target,
            'next_question': next_q_serialized,
            'session_history': updated_history,
        })


# ──────────────────────────────────────────────
# 5. Weak-Topic Detection & Dashboard
# ──────────────────────────────────────────────

class TopicStrengthDashboardView(APIView):
    """
    Returns a comprehensive topic mastery dashboard:
    - Lists all topics with accuracy and strong/average/weak tags.
    - Computes signature headline: "You're strong in Arrays, weak in Recursion".
    - Provides personalized study advice.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, course_id=None):
        qs = StudentTopicScore.objects.filter(student=request.user)
        if course_id:
            qs = qs.filter(topic__course_id=course_id)
        qs = qs.select_related('topic').order_by('-total_attempted', 'topic__name')

        data = StudentTopicScoreSerializer(qs, many=True).data

        strong_list = [d['topic_name'] for d in data if d['strength_label'] == 'strong']
        avg_list = [d['topic_name'] for d in data if d['strength_label'] == 'average']
        weak_list = [d['topic_name'] for d in data if d['strength_label'] == 'weak']

        # Construct insightful headline
        if strong_list and weak_list:
            s_str = ", ".join(strong_list[:2])
            w_str = ", ".join(weak_list[:2])
            headline = f"You're strong in {s_str}, weak in {w_str}"
            recommendation = (
                f"Great mastery in {s_str}! We recommend auto-generating a practice quiz "
                f"focusing on {w_str} to bring your weak areas up to speed."
            )
        elif weak_list and not strong_list:
            w_str = ", ".join(weak_list[:2])
            headline = f"Needs practice in {w_str}"
            recommendation = f"Take practice quizzes in {w_str} to reinforce fundamentals and build confidence."
        elif strong_list and not weak_list:
            s_str = ", ".join(strong_list[:2])
            headline = f"Strong mastery in {s_str}!"
            recommendation = "Outstanding performance across your topics! Keep practicing to maintain your streak."
        elif avg_list:
            a_str = ", ".join(avg_list[:2])
            headline = f"Solid foundation in {a_str}"
            recommendation = "You have good foundational knowledge. Practice challenging problems to achieve 'Strong' status."
        else:
            headline = "Start quizzes to discover your topic strengths"
            recommendation = "Take adaptive quizzes to generate personalized topic insights and spaced repetition flashcards."

        return Response({
            'summary': {
                'strong': len(strong_list),
                'average': len(avg_list),
                'weak': len(weak_list),
                'total_topics': len(data),
            },
            'strong_topics': strong_list,
            'average_topics': avg_list,
            'weak_topics': weak_list,
            'headline': headline,
            'recommendation': recommendation,
            'topics': data,
        })


class WeakTopicPracticeView(APIView):
    """Auto-generates a targeted practice quiz from the student's weak areas."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, course_id=None):
        topic_scores = StudentTopicScore.objects.filter(student=request.user)
        if course_id:
            topic_scores = topic_scores.filter(topic__course_id=course_id)

        weak_topic_ids = []
        weak_topic_names = []
        for ts in topic_scores:
            if ts.strength_label in ('weak', 'average'):
                weak_topic_ids.append(ts.topic_id)
                weak_topic_names.append(ts.topic.name)

        if not weak_topic_ids:
            # Fallback: if student has no scores yet, pick questions from any topics
            all_topics = Topic.objects.all()
            if course_id:
                all_topics = all_topics.filter(course_id=course_id)
            if all_topics.exists():
                weak_topic_ids = list(all_topics.values_list('id', flat=True)[:3])
                weak_topic_names = list(all_topics.values_list('name', flat=True)[:3])

        if not weak_topic_ids:
            return Response({
                'message': 'No topics available for practice yet.',
                'weak_topics': [],
                'questions': [],
            })

        questions = Question.objects.filter(
            adaptive_meta__topic_id__in=weak_topic_ids,
        ).select_related('adaptive_meta__topic').prefetch_related('choices').order_by('?')[:10]

        serializer = AdaptiveQuestionStudentViewSerializer(questions, many=True)
        return Response({
            'message': f"Practice quiz targeted at: {', '.join(weak_topic_names[:3])}",
            'weak_topics': weak_topic_names,
            'question_count': questions.count(),
            'questions': serializer.data,
        })


class SubmitWeakPracticeView(APIView):
    """
    Submits answers for a weak-topic practice quiz.
    Immediately updates student topic scores and spaced repetition cards,
    giving instant feedback on improvement.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PracticeQuizSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        answers_data = serializer.validated_data['answers']

        score = 0
        total_marks = 0
        results = []

        for ans in answers_data:
            try:
                question = Question.objects.get(id=ans['question_id'])
            except Question.DoesNotExist:
                continue

            total_marks += question.marks

            try:
                selected_choice = Choice.objects.get(
                    id=ans['choice_id'], question=question,
                )
            except Choice.DoesNotExist:
                continue

            is_correct = selected_choice.is_correct
            if is_correct:
                score += question.marks

            # Update topic score & spaced repetition
            record_question_outcome(request.user, question, is_correct)

            correct_choice = question.choices.filter(is_correct=True).first()
            topic_name = question.adaptive_meta.topic.name if hasattr(question, 'adaptive_meta') and question.adaptive_meta.topic else 'General'

            results.append({
                'question_id': question.id,
                'question_text': question.text,
                'topic_name': topic_name,
                'selected_choice': selected_choice.text,
                'correct_choice': correct_choice.text if correct_choice else '',
                'is_correct': is_correct,
            })

        percentage = round((score / total_marks * 100), 2) if total_marks > 0 else 0

        return Response({
            'score': score,
            'total_marks': total_marks,
            'percentage': percentage,
            'results': results,
            'message': f"Practice completed! Scored {score}/{total_marks} ({percentage}%). Your topic mastery has been updated.",
        }, status=status.HTTP_200_OK)


# ──────────────────────────────────────────────
# 6. Spaced Repetition (Anki-style)
# ──────────────────────────────────────────────

class SpacedRepetitionDueView(APIView):
    """Returns all due spaced-repetition cards for today."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        cards = SpacedRepetitionCard.objects.filter(
            student=request.user,
            is_retired=False,
            next_review_date__lte=today,
        ).select_related('question').prefetch_related('question__choices')

        serializer = SpacedRepetitionCardSerializer(cards, many=True)
        return Response({
            'due_count': cards.count(),
            'today': str(today),
            'cards': serializer.data,
        })


class SpacedRepetitionAllView(APIView):
    """Returns all spaced-repetition cards (due, upcoming, mastered)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cards = SpacedRepetitionCard.objects.filter(
            student=request.user,
        ).select_related('question').prefetch_related('question__choices').order_by('next_review_date')

        serializer = SpacedRepetitionCardSerializer(cards, many=True)
        today = timezone.now().date()
        due_count = cards.filter(is_retired=False, next_review_date__lte=today).count()
        return Response({
            'total': cards.count(),
            'due_count': due_count,
            'retired': cards.filter(is_retired=True).count(),
            'active': cards.filter(is_retired=False).count(),
            'cards': serializer.data,
        })


class SubmitSpacedReviewView(APIView):
    """Submit answers for spaced-repetition review cards."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = SpacedReviewSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        results = []

        for ans in serializer.validated_data['answers']:
            try:
                card = SpacedRepetitionCard.objects.get(
                    id=ans['card_id'], student=request.user,
                )
            except SpacedRepetitionCard.DoesNotExist:
                continue

            try:
                choice = Choice.objects.get(
                    id=ans['choice_id'], question=card.question,
                )
            except Choice.DoesNotExist:
                continue

            is_correct = choice.is_correct
            # Advance or reset spaced repetition interval
            card.record_review(is_correct)

            # Also update topic score
            record_question_outcome(request.user, card.question, is_correct)

            correct_choice = card.question.choices.filter(is_correct=True).first()

            results.append({
                'card_id': card.id,
                'question_id': card.question_id,
                'question_text': card.question.text,
                'is_correct': is_correct,
                'selected_choice': choice.text,
                'correct_choice': correct_choice.text if correct_choice else '',
                'next_review_date': str(card.next_review_date),
                'interval_index': card.interval_index,
                'is_retired': card.is_retired,
            })

        return Response({'results': results}, status=status.HTTP_200_OK)


class SimulateSpacedDaysView(APIView):
    """
    Testing / demo utility:
    Simulates the passage of N days by advancing the schedule of active cards,
    allowing users to immediately test the 1-day, 3-day, 7-day resurfacing intervals.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = SimulateDaysSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        days = serializer.validated_data['days']

        cards = SpacedRepetitionCard.objects.filter(
            student=request.user,
            is_retired=False,
        )
        updated_count = 0
        for card in cards:
            card.next_review_date = card.next_review_date - timedelta(days=days)
            card.save()
            updated_count += 1

        today = timezone.now().date()
        due_count = SpacedRepetitionCard.objects.filter(
            student=request.user,
            is_retired=False,
            next_review_date__lte=today,
        ).count()

        return Response({
            'message': f"Simulated advancing {days} day(s) forward.",
            'cards_updated': updated_count,
            'cards_now_due': due_count,
        }, status=status.HTTP_200_OK)


# ──────────────────────────────────────────────
# 7. Student Difficulty Levels
# ──────────────────────────────────────────────

class MyDifficultyLevelView(APIView):
    """Returns the student's current difficulty levels across quizzes."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        levels = StudentDifficultyLevel.objects.filter(
            student=request.user,
        ).select_related('quiz')
        serializer = StudentDifficultyLevelSerializer(levels, many=True)
        return Response(serializer.data)
