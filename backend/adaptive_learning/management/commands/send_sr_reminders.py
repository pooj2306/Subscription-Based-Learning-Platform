"""
Management command to check and send spaced-repetition review reminders.

Run daily via cron or Celery beat:
    python manage.py send_sr_reminders

Options:
    --days-ahead <N>   Preview cards due N days in the future (default: 0)
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from adaptive_learning.models import SpacedRepetitionCard


class Command(BaseCommand):
    help = 'List students who have spaced-repetition cards due for review today (or in N days).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days-ahead',
            type=int,
            default=0,
            help='Look ahead N days for due cards (useful for previewing schedule)',
        )

    def handle(self, *args, **options):
        days_ahead = options['days_ahead']
        target_date = timezone.now().date() + timedelta(days=days_ahead)

        due_cards = SpacedRepetitionCard.objects.filter(
            is_retired=False,
            next_review_date__lte=target_date,
        ).select_related('student', 'question')

        date_label = f"today ({target_date})" if days_ahead == 0 else f"by {target_date} (+{days_ahead}d)"

        if not due_cards.exists():
            self.stdout.write(self.style.SUCCESS(f'No spaced-repetition cards are due {date_label}.'))
            return

        # Group by student
        students = {}
        for card in due_cards:
            students.setdefault(card.student, []).append(card)

        for student, cards in students.items():
            self.stdout.write(
                self.style.WARNING(
                    f"[SR Reminder] {student.username} ({student.email}) has {len(cards)} card(s) due {date_label}."
                )
            )

        self.stdout.write(self.style.SUCCESS(
            f'Done. {len(students)} student(s) identified with {due_cards.count()} due card(s).'
        ))
