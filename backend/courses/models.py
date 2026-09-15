from django.db import models

# Create your models here.
from django.db import models
from django.conf import settings


class Course(models.Model):
    class Level(models.TextChoices):
        BEGINNER = 'BEGINNER', 'Beginner'
        INTERMEDIATE = 'INTERMEDIATE', 'Intermediate'
        ADVANCED = 'ADVANCED', 'Advanced'

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    stream = models.CharField(max_length=100)  # e.g. "Computer Science", "Business"
    level = models.CharField(max_length=20, choices=Level.choices, default=Level.BEGINNER)

    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='courses',
        limit_choices_to={'role': 'INSTRUCTOR'},
    )

    is_published = models.BooleanField(default=False)          # visibility control
    requires_subscription = models.BooleanField(default=True)  # SRS 4.3 - visibility based on subscription rules

    thumbnail = models.ImageField(upload_to='course_thumbnails/', blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class Lesson(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)  # sequence within course

    video_url = models.URLField(blank=True, null=True)   # streamed video (SRS 4.4)
    video_file = models.FileField(upload_to='lesson_videos/', blank=True, null=True)

    duration_minutes = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.course.title} - {self.title}"


class Material(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='materials')
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='lesson_materials/')  # downloadable study materials (SRS 4.4)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title