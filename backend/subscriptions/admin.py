from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Plan, Subscription


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'duration_days', 'is_active']
    list_filter = ['is_active', 'duration_days']


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['student', 'plan', 'status', 'start_date', 'end_date', 'amount_paid']
    list_filter = ['status', 'plan']
    search_fields = ['student__username', 'payment_reference']