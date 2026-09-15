from django.db import models

# Create your models here.
from django.db import models
from django.conf import settings
from courses.models import Course
import uuid


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

    issued_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'course')  # one certificate per student per course

    def save(self, *args, **kwargs):
        if not self.certificate_number:
            self.certificate_number = f"SBLP-{uuid.uuid4().hex[:10].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.certificate_number} - {self.student.username} - {self.course.title}"