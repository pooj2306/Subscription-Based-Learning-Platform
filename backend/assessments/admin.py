from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Quiz, Question, Choice, QuizAttempt, StudentAnswer


from adaptive_learning.models import AdaptiveQuestion


class AdaptiveQuestionInline(admin.StackedInline):
    model = AdaptiveQuestion
    can_delete = False
    max_num = 1
    extra = 1


class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 2


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'lesson', 'pass_percentage', 'is_active', 'created_by']
    list_filter = ['is_active', 'course']
    inlines = []


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['text', 'quiz', 'marks', 'order']
    inlines = [AdaptiveQuestionInline, ChoiceInline]


@admin.register(Choice)
class ChoiceAdmin(admin.ModelAdmin):
    list_display = ['text', 'question', 'is_correct']


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ['student', 'quiz', 'score', 'total_marks', 'percentage', 'passed', 'submitted_at']
    list_filter = ['passed', 'quiz']


@admin.register(StudentAnswer)
class StudentAnswerAdmin(admin.ModelAdmin):
    list_display = ['attempt', 'question', 'selected_choice', 'is_correct']