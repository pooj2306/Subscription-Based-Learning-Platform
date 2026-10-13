from django.db import models
from django.utils import timezone


class SupportTicket(models.Model):
    class Category(models.TextChoices):
        COURSE_ACCESS = 'COURSE_ACCESS', 'Course Access & Video Playback'
        ACCOUNT_AUTH = 'ACCOUNT_AUTH', 'Account & Authentication'
        CERTIFICATES = 'CERTIFICATES', 'Certificates & Project Verification'
        BILLING_SUBSCRIPTION = 'BILLING_SUBSCRIPTION', 'Billing, Trial & Subscription'
        QUIZ_ADAPTIVE = 'QUIZ_ADAPTIVE', 'Adaptive Quizzes & Retries'
        OTHER = 'OTHER', 'Other Technical Inquiry'

    ticket_number = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=150)
    email = models.EmailField()
    category = models.CharField(max_length=100, choices=Category.choices, default=Category.OTHER)
    subject = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=20, default='OPEN')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.ticket_number} - {self.subject} ({self.email})"
