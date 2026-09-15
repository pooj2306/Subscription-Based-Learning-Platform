from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Course, Lesson, Material


class MaterialInline(admin.TabularInline):
    model = Material
    extra = 1


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 1


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['title', 'instructor', 'stream', 'level', 'is_published', 'requires_subscription']
    list_filter = ['stream', 'level', 'is_published']
    inlines = [LessonInline]


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'order', 'duration_minutes']
    inlines = [MaterialInline]


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ['title', 'lesson']