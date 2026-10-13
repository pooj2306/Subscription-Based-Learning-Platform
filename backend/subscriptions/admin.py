from django.contrib import admin
from .models import Plan, Subscription, CoursePurchase, StudentVerification


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'duration_days', 'plan_type', 'discount_percentage', 'is_active']
    list_filter = ['is_active', 'plan_type', 'duration_days']


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['student', 'plan', 'status', 'is_trial', 'start_date', 'end_date', 'amount_paid']
    list_filter = ['status', 'is_trial', 'plan']
    search_fields = ['student__username', 'payment_reference']


@admin.register(CoursePurchase)
class CoursePurchaseAdmin(admin.ModelAdmin):
    list_display = ['student', 'course', 'amount_paid', 'purchased_at']
    list_filter = ['purchased_at']
    search_fields = ['student__username', 'course__title']


@admin.register(StudentVerification)
class StudentVerificationAdmin(admin.ModelAdmin):
    list_display = ['student', 'institution_name', 'student_id_number', 'status', 'discount_rate', 'verified_at']
    list_filter = ['status']
    search_fields = ['student__username', 'institution_name', 'student_id_number']