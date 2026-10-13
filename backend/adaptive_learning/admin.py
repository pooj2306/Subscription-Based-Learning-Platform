from django.contrib import admin
from .models import (
    Topic, AdaptiveQuestion, StudentDifficultyLevel,
    StudentTopicScore, SpacedRepetitionCard,
)


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ('name', 'course')
    list_filter = ('course',)
    search_fields = ('name',)


@admin.register(AdaptiveQuestion)
class AdaptiveQuestionAdmin(admin.ModelAdmin):
    list_display = ('question', 'difficulty', 'topic')
    list_filter = ('difficulty', 'topic')


@admin.register(StudentDifficultyLevel)
class StudentDifficultyLevelAdmin(admin.ModelAdmin):
    list_display = ('student', 'quiz', 'current_level', 'consecutive_correct', 'consecutive_wrong')
    list_filter = ('current_level',)


@admin.register(StudentTopicScore)
class StudentTopicScoreAdmin(admin.ModelAdmin):
    list_display = ('student', 'topic', 'total_attempted', 'total_correct', 'accuracy', 'elo_rating', 'elo_tier')
    list_filter = ('topic', 'elo_rating')



@admin.register(SpacedRepetitionCard)
class SpacedRepetitionCardAdmin(admin.ModelAdmin):
    list_display = ('student', 'question', 'next_review_date', 'interval_index', 'is_retired')
    list_filter = ('is_retired', 'next_review_date')
