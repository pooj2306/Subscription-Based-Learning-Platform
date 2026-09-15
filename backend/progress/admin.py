from django.contrib import admin

# Register your models here.
from .models import LessonProgress, CourseProgress


@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display = ['student', 'lesson', 'is_completed', 'last_watched_position_seconds', 'completed_at']
    list_filter = ['is_completed']
    search_fields = ['student__username', 'lesson__title']


@admin.register(CourseProgress)
class CourseProgressAdmin(admin.ModelAdmin):
    list_display = ['student', 'course', 'completed_lessons', 'total_lessons', 'progress_percent', 'is_course_completed']
    list_filter = ['is_course_completed']
    search_fields = ['student__username', 'course__title']