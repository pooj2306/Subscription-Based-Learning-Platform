from django.db import models

# Create your models here.
from django.conf import settings
from courses.models import Course, Lesson


class LessonProgress(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='lesson_progress',
        limit_choices_to={'role': 'STUDENT'},
    )
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='progress_entries')

    is_completed = models.BooleanField(default=False)
    last_watched_position_seconds = models.PositiveIntegerField(default=0)  # for pause/resume (SRS 4.5)

    completed_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'lesson')  # one progress record per student per lesson

    def __str__(self):
        status = "Completed" if self.is_completed else "In Progress"
        return f"{self.student.username} - {self.lesson.title} ({status})"


class CourseProgress(models.Model):
    """Aggregated, auto-updated summary of a student's progress in a course."""
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='course_progress',
        limit_choices_to={'role': 'STUDENT'},
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='progress_entries')

    total_lessons = models.PositiveIntegerField(default=0)
    completed_lessons = models.PositiveIntegerField(default=0)
    progress_percent = models.FloatField(default=0.0)

    is_course_completed = models.BooleanField(default=False)
    started_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'course')

    def recalculate(self):
        total = self.course.lessons.count()
        completed = LessonProgress.objects.filter(
            student=self.student,
            lesson__course=self.course,
            is_completed=True,
        ).count()

        self.total_lessons = total
        self.completed_lessons = completed
        self.progress_percent = round((completed / total) * 100, 2) if total > 0 else 0.0
        self.is_course_completed = total > 0 and completed == total
        self.save()

    def __str__(self):
        return f"{self.student.username} - {self.course.title} ({self.progress_percent}%)"