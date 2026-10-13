from datetime import timedelta
from django.utils import timezone
from .models import (
    AdaptiveQuestion,
    StudentTopicScore,
    SpacedRepetitionCard,
    StudentDifficultyLevel,
)


def record_question_outcome(student, question, is_correct: bool):
    """
    Updates the student's topic score and spaced repetition cards for a question.
    Can be called from standard quiz grading, adaptive quizzes, or practice quizzes.
    """
    # 1. Update topic score if question is tagged with a topic
    try:
        adaptive_meta = question.adaptive_meta
        topic = adaptive_meta.topic
        if topic:
            ts, _ = StudentTopicScore.objects.get_or_create(
                student=student, topic=topic,
            )
            ts.total_attempted += 1
            if is_correct:
                ts.total_correct += 1
            diff = getattr(adaptive_meta, 'difficulty', 2) or 2
            ts.update_elo(question_difficulty=diff, is_correct=is_correct)
            ts.save()
    except (AdaptiveQuestion.DoesNotExist, AttributeError):
        pass

    # 2. Update spaced repetition
    today = timezone.now().date()
    if not is_correct:
        # Wrong answer resurfaces after 1 day (interval index 0)
        card, created = SpacedRepetitionCard.objects.get_or_create(
            student=student,
            question=question,
            defaults={
                'next_review_date': today + timedelta(days=1),
                'interval_index': 0,
                'is_retired': False,
            },
        )
        if not created:
            card.interval_index = 0
            card.is_retired = False
            card.next_review_date = today + timedelta(days=1)
            card.save()
    else:
        # If student gets it right and a card exists, advance it
        try:
            card = SpacedRepetitionCard.objects.get(
                student=student,
                question=question,
                is_retired=False,
            )
            card.record_review(True)
        except SpacedRepetitionCard.DoesNotExist:
            pass


def adjust_difficulty_for_answer(student, quiz, is_correct: bool):
    """
    Applies the rule-based difficulty adjustment:
    - 3 correct in a row -> move up a level (max 3: Hard)
    - 2 wrong in a row -> move down a level (min 1: Easy)
    Returns:
        (old_level, new_level, level_changed, consecutive_correct, consecutive_wrong)
    """
    tracker, _ = StudentDifficultyLevel.objects.get_or_create(
        student=student,
        quiz=quiz,
        defaults={'current_level': 1},
    )
    old_level = tracker.current_level
    tracker.adjust(is_correct)
    new_level = tracker.current_level
    level_changed = (old_level != new_level)
    return (
        old_level,
        new_level,
        level_changed,
        tracker.consecutive_correct,
        tracker.consecutive_wrong,
    )
