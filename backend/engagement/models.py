from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import math


# ──────────────────────────────────────────────
# 1. Streaks, XP, Leveling & Gamification
# ──────────────────────────────────────────────

class GamificationProfile(models.Model):
    student = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='gamification',
    )
    xp = models.PositiveIntegerField(default=0)
    level = models.PositiveIntegerField(default=1)
    current_streak = models.PositiveIntegerField(default=0)
    longest_streak = models.PositiveIntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)
    total_focus_minutes = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def calculate_level(self):
        # 500 XP per level with progression
        return max(1, (self.xp // 500) + 1)

    @property
    def level_title(self):
        titles = {
            1: "Novice Explorer",
            2: "Curious Learner",
            3: "Code Apprentice",
            4: "Problem Solver",
            5: "Algorithm Scholar",
            6: "Deep Thinker",
            7: "Master Architect",
            8: "Elite Grandmaster",
        }
        return titles.get(min(self.level, 8), f"Grandmaster Level {self.level}")

    @property
    def xp_current_level_progress(self):
        return self.xp % 500

    @property
    def xp_needed_for_next_level(self):
        return 500 - (self.xp % 500)

    @property
    def level_progress_percent(self):
        return round(((self.xp % 500) / 500) * 100, 1)

    def award_xp(self, amount: int, reason: str = ""):
        self.xp += amount
        new_level = self.calculate_level()
        leveled_up = new_level > self.level
        self.level = new_level
        self.record_daily_activity()
        self.save()

        XPTransaction.objects.create(
            student=self.student,
            amount=amount,
            reason=reason or "Earned XP",
        )

        # Check badges on XP award
        check_and_award_badges(self.student)
        return {"new_xp": self.xp, "level": self.level, "leveled_up": leveled_up}

    def record_daily_activity(self):
        today = timezone.now().date()
        if self.last_activity_date == today:
            return False  # Already counted today

        if self.last_activity_date == today - timedelta(days=1):
            self.current_streak += 1
        else:
            self.current_streak = 1

        if self.current_streak > self.longest_streak:
            self.longest_streak = self.current_streak

        self.last_activity_date = today
        self.save()
        return True

    def __str__(self):
        return f"{self.student.username}: Lvl {self.level} ({self.xp} XP) — {self.current_streak}d streak"


class XPTransaction(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='xp_transactions',
    )
    amount = models.IntegerField()
    reason = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"+{self.amount} XP to {self.student.username} ({self.reason})"


# ──────────────────────────────────────────────
# 2. Badges & Achievements
# ──────────────────────────────────────────────

class Badge(models.Model):
    class Category(models.TextChoices):
        STREAK = 'STREAK', 'Streak & Discipline'
        FOCUS = 'FOCUS', 'Focus & Pomodoro'
        ACADEMIC = 'ACADEMIC', 'Mastery & Quizzes'
        COMMUNITY = 'COMMUNITY', 'Study Groups'
        ROADMAP = 'ROADMAP', 'Roadmaps & Skill Trees'

    code = models.CharField(max_length=64, unique=True)
    title = models.CharField(max_length=120)
    description = models.TextField()
    icon = models.CharField(max_length=32, default='🏅')
    category = models.CharField(max_length=32, choices=Category.choices, default=Category.ACADEMIC)
    xp_reward = models.PositiveIntegerField(default=100)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'title']

    def __str__(self):
        return f"{self.icon} {self.title} ({self.code})"


class EarnedBadge(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='earned_badges',
    )
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE, related_name='awards')
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'badge')
        ordering = ['-earned_at']

    def __str__(self):
        return f"{self.student.username} earned {self.badge.title}"


def check_and_award_badges(student):
    """Evaluates student's current stats and unlocks any qualified badges."""
    profile, _ = GamificationProfile.objects.get_or_create(student=student)
    earned_codes = set(
        EarnedBadge.objects.filter(student=student).values_list('badge__code', flat=True)
    )

    qualifying_codes = []

    # Streak badges
    if profile.current_streak >= 3:
        qualifying_codes.append('STREAK_3')
    if profile.current_streak >= 7:
        qualifying_codes.append('STREAK_7')
    if profile.current_streak >= 14:
        qualifying_codes.append('STREAK_14')

    # XP badges
    if profile.xp >= 500:
        qualifying_codes.append('XP_500')
    if profile.xp >= 2000:
        qualifying_codes.append('XP_2000')

    # Focus badges
    if profile.total_focus_minutes >= 50:
        qualifying_codes.append('FOCUS_50')
    if profile.total_focus_minutes >= 250:
        qualifying_codes.append('FOCUS_DEEP_MASTER')

    # Study group badges
    if student.study_groups.exists():
        qualifying_codes.append('GROUP_JOINED')

    for code in qualifying_codes:
        if code not in earned_codes:
            badge = Badge.objects.filter(code=code).first()
            if badge:
                EarnedBadge.objects.create(student=student, badge=badge)
                # Give badge reward bonus without recursive call
                profile.xp += badge.xp_reward
                profile.level = profile.calculate_level()
                profile.save()
                XPTransaction.objects.create(
                    student=student,
                    amount=badge.xp_reward,
                    reason=f"Unlocked Badge: {badge.title}",
                )


# ──────────────────────────────────────────────
# 3. Study Groups with Shared Weekly Goal
# ──────────────────────────────────────────────

class StudyGroup(models.Model):
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=16, default='🚀')
    color_theme = models.CharField(max_length=32, default='indigo')  # indigo, emerald, amber, rose, purple
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_study_groups',
    )
    weekly_goal_title = models.CharField(max_length=200, default='Conquer 2,500 collective XP and 500 Focus Minutes')
    target_weekly_xp = models.PositiveIntegerField(default=2500)
    target_weekly_focus_minutes = models.PositiveIntegerField(default=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def current_weekly_xp(self):
        return sum(m.weekly_contributed_xp for m in self.memberships.all())

    @property
    def current_weekly_focus_minutes(self):
        return sum(m.weekly_contributed_minutes for m in self.memberships.all())

    @property
    def goal_progress_percent(self):
        if self.target_weekly_xp == 0:
            return 100.0
        return min(100.0, round((self.current_weekly_xp / self.target_weekly_xp) * 100, 1))

    @property
    def member_count(self):
        return self.memberships.count()

    def __str__(self):
        return f"{self.icon} {self.name} ({self.goal_progress_percent}% goal)"


class StudyGroupMembership(models.Model):
    class Role(models.TextChoices):
        LEADER = 'LEADER', 'Group Leader'
        MEMBER = 'MEMBER', 'Member'

    group = models.ForeignKey(StudyGroup, on_delete=models.CASCADE, related_name='memberships')
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='study_groups',
    )
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.MEMBER)
    weekly_contributed_xp = models.PositiveIntegerField(default=0)
    weekly_contributed_minutes = models.PositiveIntegerField(default=0)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('group', 'student')
        ordering = ['-weekly_contributed_xp', 'joined_at']

    def contribute(self, xp: int = 0, minutes: int = 0):
        self.weekly_contributed_xp += xp
        self.weekly_contributed_minutes += minutes
        self.save()

    def __str__(self):
        return f"{self.student.username} in {self.group.name} ({self.weekly_contributed_xp} XP contributed)"


class StudyGroupMessage(models.Model):
    group = models.ForeignKey(StudyGroup, on_delete=models.CASCADE, related_name='messages')
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='group_messages',
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"[{self.group.name}] {self.author.username}: {self.content[:30]}"


# ──────────────────────────────────────────────
# 4. Learning Roadmaps & Visual Skill Tree
# ──────────────────────────────────────────────

class Roadmap(models.Model):
    title = models.CharField(max_length=150)
    slug = models.SlugField(max_length=150, unique=True)
    tagline = models.CharField(max_length=255, default='Structured path from fundamentals to mastery')
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=32, default='🗺️')
    category = models.CharField(max_length=64, default='Computer Science')
    color_gradient = models.CharField(max_length=64, default='from-brand-600 to-indigo-700')
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'title']

    def __str__(self):
        return f"{self.icon} {self.title}"


class RoadmapNode(models.Model):
    roadmap = models.ForeignKey(Roadmap, on_delete=models.CASCADE, related_name='nodes')
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='roadmap_nodes')
    stage_order = models.PositiveIntegerField(default=1)  # 1, 2, 3 in sequence
    skill_tag = models.CharField(max_length=80, blank=True, help_text="e.g. Core Fundamentals, Data Structures")
    short_description = models.CharField(max_length=255, blank=True)
    prerequisites = models.ManyToManyField(
        'self',
        symmetrical=False,
        blank=True,
        related_name='unlocked_nodes',
    )
    reward_xp = models.PositiveIntegerField(default=300)
    icon = models.CharField(max_length=32, default='⚡')

    class Meta:
        ordering = ['stage_order']

    def is_unlocked_for_student(self, student):
        """Node is unlocked if student has completed all prerequisite courses (or if no prerequisites)."""
        prereqs = self.prerequisites.all()
        if not prereqs.exists():
            return True

        from progress.models import CourseProgress
        for prereq_node in prereqs:
            progress = CourseProgress.objects.filter(
                student=student,
                course=prereq_node.course,
            ).first()
            if not progress or not progress.is_course_completed:
                return False
        return True

    def is_completed_for_student(self, student):
        from progress.models import CourseProgress
        progress = CourseProgress.objects.filter(
            student=student,
            course=self.course,
        ).first()
        return bool(progress and progress.is_course_completed)

    def get_progress_for_student(self, student):
        from progress.models import CourseProgress
        progress = CourseProgress.objects.filter(
            student=student,
            course=self.course,
        ).first()
        return progress.progress_percent if progress else 0.0

    def __str__(self):
        return f"Stage {self.stage_order}: {self.course.title} ({self.roadmap.title})"


# ──────────────────────────────────────────────
# 5. Focus Mode: Pomodoro Session Tracker
# ──────────────────────────────────────────────

class FocusSession(models.Model):
    class Mode(models.TextChoices):
        POMODORO = 'POMODORO_25', 'Pomodoro (25m)'
        DEEP_WORK = 'DEEP_WORK_50', 'Deep Work (50m)'
        SHORT_FOCUS = 'SHORT_15', 'Quick Sprint (15m)'
        CUSTOM = 'CUSTOM', 'Custom Focus'

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='focus_sessions',
    )
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='focus_sessions',
    )
    lesson = models.ForeignKey(
        'courses.Lesson',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='focus_sessions',
    )
    mode = models.CharField(max_length=32, choices=Mode.choices, default=Mode.POMODORO)
    duration_minutes = models.PositiveIntegerField(default=25)
    notes = models.TextField(blank=True, default='')
    xp_earned = models.PositiveIntegerField(default=50)
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-completed_at']

    def __str__(self):
        return f"{self.student.username}: {self.duration_minutes}m focused ({self.completed_at.strftime('%Y-%m-%d %H:%M')})"
