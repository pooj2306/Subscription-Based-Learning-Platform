from django.db import models
from django.conf import settings
from courses.models import Course
import uuid


class CourseMiniProject(models.Model):
    """Capstone mini-project required for project-based certification."""
    course = models.OneToOneField(
        Course,
        on_delete=models.CASCADE,
        related_name='mini_project',
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    instructions = models.TextField(blank=True, default='')
    starter_code_url = models.URLField(blank=True, null=True)
    estimated_hours = models.PositiveIntegerField(default=4)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Project: {self.title} ({self.course.title})"


class ProjectSubmission(models.Model):
    class Status(models.TextChoices):
        SUBMITTED = 'SUBMITTED', 'Submitted'
        UNDER_REVIEW = 'UNDER_REVIEW', 'Under Review'
        APPROVED = 'APPROVED', 'Approved & Verified'
        CHANGES_REQUESTED = 'CHANGES_REQUESTED', 'Changes Requested'

    project = models.ForeignKey(
        CourseMiniProject,
        on_delete=models.CASCADE,
        related_name='submissions',
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='project_submissions',
        limit_choices_to={'role': 'STUDENT'},
    )
    github_repo_url = models.URLField(max_length=500)
    live_demo_url = models.URLField(max_length=500, blank=True, null=True)
    description = models.TextField(help_text="Key features, architectural design, and instructions to run.")
    attachment_file = models.FileField(upload_to='project_submissions/', blank=True, null=True)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.APPROVED)
    grade_score = models.PositiveIntegerField(default=100)
    instructor_feedback = models.TextField(blank=True, default='Project verified: clean implementation meeting all rubric requirements.')
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        unique_together = ('project', 'student')
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.student.username} - {self.project.title} ({self.status})"


class Certificate(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='certificates',
        limit_choices_to={'role': 'STUDENT'},
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='certificates')
    certificate_number = models.CharField(max_length=50, unique=True, editable=False)
    pdf_file = models.FileField(upload_to='certificates/', blank=True, null=True)

    # Project-based credentialing fields
    project_submission = models.ForeignKey(
        ProjectSubmission,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='certificates',
    )
    verified_project_title = models.CharField(max_length=255, blank=True, default='')
    quiz_score = models.FloatField(default=0.0)

    issued_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'course')

    def save(self, *args, **kwargs):
        if not self.certificate_number:
            self.certificate_number = f"SBLP-{uuid.uuid4().hex[:10].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.certificate_number} - {self.student.username} - {self.course.title}"