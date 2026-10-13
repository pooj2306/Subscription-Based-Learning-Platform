from django.contrib import admin
from .models import Certificate, CourseMiniProject, ProjectSubmission


@admin.register(CourseMiniProject)
class CourseMiniProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'estimated_hours', 'created_at')
    search_fields = ('title', 'course__title')


@admin.register(ProjectSubmission)
class ProjectSubmissionAdmin(admin.ModelAdmin):
    list_display = ('student', 'project', 'status', 'grade_score', 'submitted_at')
    list_filter = ('status', 'submitted_at')
    search_fields = ('student__username', 'project__title')


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ('certificate_number', 'student', 'course', 'verified_project_title', 'quiz_score', 'issued_at')
    search_fields = ('certificate_number', 'student__username', 'course__title')