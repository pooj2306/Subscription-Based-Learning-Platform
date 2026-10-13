from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


class Plan(models.Model):
    class Duration(models.IntegerChoices):
        TRIAL = 7, '7 Days'
        MONTHLY = 30, '30 Days'
        QUARTERLY = 90, '90 Days'
        YEARLY = 365, '365 Days'

    class PlanType(models.TextChoices):
        STANDARD = 'STANDARD', 'Standard'
        STUDENT = 'STUDENT', 'Student Discount'
        TRIAL = 'TRIAL', 'Free Trial'

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    duration_days = models.IntegerField(default=30)
    plan_type = models.CharField(max_length=20, choices=PlanType.choices, default=PlanType.STANDARD)
    discount_percentage = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} - ₹{self.price} ({self.duration_days} days) [{self.plan_type}]"


class Subscription(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        PAUSED = 'PAUSED', 'Paused'
        EXPIRED = 'EXPIRED', 'Expired'
        CANCELLED = 'CANCELLED', 'Cancelled'
        PENDING = 'PENDING', 'Pending Payment'

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='subscriptions',
        limit_choices_to={'role': 'STUDENT'},
    )
    plan = models.ForeignKey(
        Plan,
        on_delete=models.PROTECT,
        related_name='subscriptions',
        null=True,
        blank=True,
    )

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(blank=True, null=True)

    is_trial = models.BooleanField(default=False)
    paused_at = models.DateTimeField(blank=True, null=True)
    remaining_days_at_pause = models.PositiveIntegerField(default=0)

    razorpay_order_id = models.CharField(max_length=100, blank=True, null=True)
    payment_reference = models.CharField(max_length=255, blank=True, null=True)
    amount_paid = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.end_date:
            if self.plan:
                self.end_date = self.start_date + timedelta(days=self.plan.duration_days)
            elif self.is_trial:
                self.end_date = self.start_date + timedelta(days=7)
            else:
                self.end_date = self.start_date + timedelta(days=30)
        super().save(*args, **kwargs)

    @property
    def is_active(self):
        return self.status == self.Status.ACTIVE and self.end_date and self.end_date > timezone.now()

    def pause(self):
        if self.status != self.Status.ACTIVE:
            raise ValueError("Only active subscriptions can be paused.")
        now = timezone.now()
        if self.end_date and self.end_date > now:
            remaining_seconds = (self.end_date - now).total_seconds()
            self.remaining_days_at_pause = max(1, int(remaining_seconds // 86400))
        else:
            self.remaining_days_at_pause = 0
        self.status = self.Status.PAUSED
        self.paused_at = now
        self.save()

    def resume(self):
        if self.status != self.Status.PAUSED:
            raise ValueError("Only paused subscriptions can be resumed.")
        now = timezone.now()
        self.start_date = now
        self.end_date = now + timedelta(days=max(1, self.remaining_days_at_pause))
        self.status = self.Status.ACTIVE
        self.paused_at = None
        self.remaining_days_at_pause = 0
        self.save()

    def __str__(self):
        plan_name = self.plan.name if self.plan else ("Free Trial" if self.is_trial else "Custom")
        return f"{self.student.username} - {plan_name} ({self.status})"


class CoursePurchase(models.Model):
    """Pay-per-course purchase for students who prefer one-time course ownership."""
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='course_purchases',
        limit_choices_to={'role': 'STUDENT'},
    )
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.CASCADE,
        related_name='purchases',
    )
    amount_paid = models.DecimalField(max_digits=8, decimal_places=2)
    payment_reference = models.CharField(max_length=255, default='PAY-PER-COURSE')
    purchased_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'course')

    def __str__(self):
        return f"{self.student.username} - {self.course.title} (₹{self.amount_paid})"


class StudentVerification(models.Model):
    """Verification for student-discount tiers."""
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        VERIFIED = 'VERIFIED', 'Verified'
        REJECTED = 'REJECTED', 'Rejected'

    student = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='student_verification',
    )
    institution_name = models.CharField(max_length=255)
    student_id_number = models.CharField(max_length=100)
    student_email = models.EmailField(blank=True, null=True)
    document_name = models.CharField(max_length=255, blank=True, default='Student_ID_Card.pdf')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.VERIFIED)
    discount_rate = models.PositiveIntegerField(default=50)  # 50% discount
    verified_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.username} - {self.institution_name} ({self.status})"