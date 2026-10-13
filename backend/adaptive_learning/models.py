from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


# ──────────────────────────────────────────────
# 1. Topic tagging for questions
# ──────────────────────────────────────────────

class Topic(models.Model):
    """A topic tag that can be attached to questions (e.g. 'Arrays', 'Recursion')."""
    name = models.CharField(max_length=120, unique=True)
    course = models.ForeignKey(
        'courses.Course', on_delete=models.CASCADE, related_name='topics',
    )

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.course.title})"


# ──────────────────────────────────────────────
# 2. Adaptive quiz – difficulty levels
# ──────────────────────────────────────────────

class AdaptiveQuestion(models.Model):
    """Extends base Question with difficulty + topic tagging."""

    class Difficulty(models.IntegerChoices):
        EASY = 1, 'Easy'
        MEDIUM = 2, 'Medium'
        HARD = 3, 'Hard'

    question = models.OneToOneField(
        'assessments.Question', on_delete=models.CASCADE,
        related_name='adaptive_meta',
    )
    difficulty = models.IntegerField(
        choices=Difficulty.choices, default=Difficulty.MEDIUM,
    )
    topic = models.ForeignKey(
        Topic, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='questions',
    )

    def __str__(self):
        return f"Q{self.question_id} — {self.get_difficulty_display()} — {self.topic}"


class StudentDifficultyLevel(models.Model):
    """Tracks the current adaptive difficulty level for every (student, quiz)."""

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='difficulty_levels',
    )
    quiz = models.ForeignKey(
        'assessments.Quiz', on_delete=models.CASCADE,
        related_name='student_difficulty_levels',
    )
    current_level = models.IntegerField(
        choices=AdaptiveQuestion.Difficulty.choices,
        default=AdaptiveQuestion.Difficulty.EASY,
    )
    consecutive_correct = models.PositiveIntegerField(default=0)
    consecutive_wrong = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('student', 'quiz')

    def adjust(self, is_correct: bool):
        """Rule-based: 3 correct ➜ level up; 2 wrong ➜ level down."""
        if is_correct:
            self.consecutive_correct += 1
            self.consecutive_wrong = 0
            if self.consecutive_correct >= 3 and self.current_level < 3:
                self.current_level += 1
                self.consecutive_correct = 0
        else:
            self.consecutive_wrong += 1
            self.consecutive_correct = 0
            if self.consecutive_wrong >= 2 and self.current_level > 1:
                self.current_level -= 1
                self.consecutive_wrong = 0
        self.save()

    def __str__(self):
        return (
            f"{self.student.username} – {self.quiz.title} "
            f"(Lvl {self.get_current_level_display()})"
        )


# ──────────────────────────────────────────────
# 3. Weak-topic detection (per-topic scoring)
# ──────────────────────────────────────────────

class StudentTopicScore(models.Model):
    """Running tally of correct / total per topic per student."""

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='topic_scores',
    )
    topic = models.ForeignKey(
        Topic, on_delete=models.CASCADE, related_name='student_scores',
    )
    total_attempted = models.PositiveIntegerField(default=0)
    total_correct = models.PositiveIntegerField(default=0)
    elo_rating = models.IntegerField(default=1200)

    class Meta:
        unique_together = ('student', 'topic')

    @property
    def accuracy(self):
        return round(self.total_correct / self.total_attempted * 100, 1) if self.total_attempted else 0.0

    @property
    def strength_label(self):
        acc = self.accuracy
        if acc >= 80:
            return 'strong'
        elif acc >= 50:
            return 'average'
        return 'weak'

    def update_elo(self, question_difficulty: int = 2, is_correct: bool = False, k_factor: int = 32):
        """
        Updates Elo rating based on question difficulty:
        1: Easy (1000), 2: Medium (1200), 3: Hard (1400)
        """
        diff_to_elo = {1: 1000, 2: 1200, 3: 1400}
        q_elo = diff_to_elo.get(question_difficulty, 1200)
        expected = 1.0 / (1.0 + 10.0 ** ((q_elo - self.elo_rating) / 400.0))
        actual = 1.0 if is_correct else 0.0
        delta = round(k_factor * (actual - expected))
        self.elo_rating = max(600, self.elo_rating + delta)
        return delta

    @property
    def elo_tier(self):
        if self.elo_rating >= 1350:
            return 'Master'
        elif self.elo_rating >= 1200:
            return 'Proficient'
        elif self.elo_rating >= 1050:
            return 'Intermediate'
        return 'Novice'

    def __str__(self):
        return f"{self.student.username} – {self.topic.name}: {self.accuracy}% (Elo: {self.elo_rating})"


# ──────────────────────────────────────────────
# 4. Spaced repetition (Anki-style)
# ──────────────────────────────────────────────

SPACED_INTERVALS = [1, 3, 7, 14, 30]  # days


class SpacedRepetitionCard(models.Model):
    """Each wrong answer becomes a card that resurfaces on schedule."""

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='sr_cards',
    )
    question = models.ForeignKey(
        'assessments.Question', on_delete=models.CASCADE,
        related_name='sr_cards',
    )
    # 0-based index into SPACED_INTERVALS
    interval_index = models.PositiveIntegerField(default=0)
    next_review_date = models.DateField(default=timezone.now)
    last_reviewed = models.DateTimeField(null=True, blank=True)
    is_retired = models.BooleanField(default=False)  # mastered → retire

    class Meta:
        unique_together = ('student', 'question')

    def record_review(self, is_correct: bool):
        """Move forward on correct, reset on wrong."""
        self.last_reviewed = timezone.now()
        if is_correct:
            self.interval_index = min(
                self.interval_index + 1, len(SPACED_INTERVALS) - 1,
            )
            if self.interval_index >= len(SPACED_INTERVALS) - 1:
                self.is_retired = True
        else:
            self.interval_index = 0  # reset
        self.next_review_date = (
            timezone.now() + timedelta(days=SPACED_INTERVALS[self.interval_index])
        ).date()
        self.save()

    @property
    def is_due(self):
        return not self.is_retired and self.next_review_date <= timezone.now().date()

    def __str__(self):
        return f"SR: {self.student.username} – Q{self.question_id} (next: {self.next_review_date})"
