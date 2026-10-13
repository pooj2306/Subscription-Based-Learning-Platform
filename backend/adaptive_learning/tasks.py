"""
Background / Celery tasks for adaptive learning and spaced repetition.

Can be run via Celery Beat on a daily schedule, or invoked via management command.
"""
import logging
from django.utils import timezone
from datetime import timedelta
from adaptive_learning.models import SpacedRepetitionCard

logger = logging.getLogger(__name__)


def process_daily_spaced_repetition(days_ahead: int = 0):
    """
    Finds all students with spaced repetition cards due today (or within days_ahead),
    and dispatches review reminders.
    """
    target_date = timezone.now().date() + timedelta(days=days_ahead)
    due_cards = SpacedRepetitionCard.objects.filter(
        is_retired=False,
        next_review_date__lte=target_date,
    ).select_related('student', 'question')

    if not due_cards.exists():
        logger.info(f"No spaced repetition cards due on {target_date}.")
        return {'status': 'success', 'notified_students': 0, 'total_due_cards': 0}

    # Group by student
    student_map = {}
    for card in due_cards:
        student_map.setdefault(card.student, []).append(card)

    for student, cards in student_map.items():
        logger.info(
            f"[Spaced Repetition Notification] Student {student.username} ({student.email}) "
            f"has {len(cards)} card(s) due for review on {target_date}."
        )
        # Production integration: send_mail(...) or push_notification(...)

    return {
        'status': 'success',
        'notified_students': len(student_map),
        'total_due_cards': due_cards.count(),
        'date': str(target_date),
    }


# Optional Celery task integration if celery is installed & running
try:
    from celery import shared_task

    @shared_task(name='adaptive_learning.send_daily_spaced_repetition_reminders')
    def send_daily_spaced_repetition_reminders():
        return process_daily_spaced_repetition(days_ahead=0)
except ImportError:
    pass
