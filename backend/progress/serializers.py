from rest_framework import serializers
from .models import LessonProgress, CourseProgress


class LessonProgressSerializer(serializers.ModelSerializer):
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)

    class Meta:
        model = LessonProgress
        fields = [
            'id', 'lesson', 'lesson_title', 'is_completed',
            'last_watched_position_seconds', 'completed_at', 'updated_at',
        ]
        read_only_fields = ['completed_at']


class UpdateProgressSerializer(serializers.Serializer):
    """Used when a student updates their watch position or marks a lesson complete."""
    lesson_id = serializers.IntegerField()
    last_watched_position_seconds = serializers.IntegerField(required=False, default=0)
    is_completed = serializers.BooleanField(required=False, default=False)


class CourseProgressSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = CourseProgress
        fields = [
            'id', 'course', 'course_title', 'total_lessons', 'completed_lessons',
            'progress_percent', 'is_course_completed', 'started_at', 'updated_at',
        ]