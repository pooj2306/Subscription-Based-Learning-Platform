from rest_framework import serializers
from .models import Course, Lesson, Material


class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = ['id', 'title', 'file', 'uploaded_at']


class LessonSerializer(serializers.ModelSerializer):
    materials = MaterialSerializer(many=True, read_only=True)

    class Meta:
        model = Lesson
        fields = ['id', 'course', 'title', 'order', 'video_url', 'video_file', 'duration_minutes', 'materials']
        read_only_fields = ['course']

class LessonListSerializer(serializers.ModelSerializer):
    """Lightweight version used when nesting lessons inside a course list."""
    class Meta:
        model = Lesson
        fields = ['id', 'title', 'order', 'duration_minutes']


class CourseSerializer(serializers.ModelSerializer):
    instructor_name = serializers.CharField(source='instructor.username', read_only=True)
    lessons = LessonListSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'stream', 'level',
            'instructor', 'instructor_name',
            'is_published', 'requires_subscription',
            'thumbnail', 'lessons', 'created_at', 'updated_at',
        ]
        read_only_fields = ['instructor']


class CourseCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = [
            'title', 'description', 'stream', 'level',
            'is_published', 'requires_subscription', 'thumbnail',
        ]