from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Certificate


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ['certificate_number', 'student', 'course', 'issued_at']
    search_fields = ['certificate_number', 'student__username']