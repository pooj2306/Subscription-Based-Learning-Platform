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
        fields = ['id', 'course', 'module_name', 'title', 'order', 'video_url', 'video_file', 'notes', 'duration_minutes', 'materials']
        read_only_fields = ['course']


class LessonListSerializer(serializers.ModelSerializer):
    """Lightweight version used when nesting lessons inside a course list."""
    class Meta:
        model = Lesson
        fields = ['id', 'module_name', 'title', 'order', 'duration_minutes']


class CourseSerializer(serializers.ModelSerializer):
    instructor_name = serializers.CharField(source='instructor.username', read_only=True)
    lessons = LessonListSerializer(many=True, read_only=True)
    has_access = serializers.SerializerMethodField()
    is_purchased = serializers.SerializerMethodField()
    is_subscription_paused = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'stream', 'level',
            'instructor', 'instructor_name',
            'is_published', 'requires_subscription',
            'is_premium', 'price',
            'has_access', 'is_purchased', 'is_subscription_paused',
            'thumbnail', 'lessons', 'created_at', 'updated_at',
        ]
        read_only_fields = ['instructor']

    def get_has_access(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return not obj.requires_subscription
        if request.user.role in ['INSTRUCTOR', 'ADMIN']:
            return True
        if not obj.requires_subscription:
            return True

        from django.conf import settings
        from subscriptions.models import Subscription, CoursePurchase

        has_active_sub = Subscription.objects.filter(student=request.user, status='ACTIVE').exists() and any(
            sub.is_active for sub in Subscription.objects.filter(student=request.user, status='ACTIVE')
        )
        has_paused_sub = Subscription.objects.filter(student=request.user, status=Subscription.Status.PAUSED).exists()
        pause_stops_owned = getattr(settings, 'PAUSE_STOPS_OWNED_COURSE_ACCESS', True)

        if has_paused_sub and not has_active_sub and pause_stops_owned:
            return False

        if has_active_sub:
            return True

        # Pay-per-course check
        return CoursePurchase.objects.filter(student=request.user, course=obj).exists()

    def get_is_purchased(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return False
        from subscriptions.models import CoursePurchase
        return CoursePurchase.objects.filter(student=request.user, course=obj).exists()

    def get_is_subscription_paused(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return False
        from subscriptions.models import Subscription
        has_active_sub = Subscription.objects.filter(student=request.user, status='ACTIVE').exists() and any(
            sub.is_active for sub in Subscription.objects.filter(student=request.user, status='ACTIVE')
        )
        return Subscription.objects.filter(student=request.user, status=Subscription.Status.PAUSED).exists() and not has_active_sub


class CourseCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = [
            'title', 'description', 'stream', 'level',
            'is_published', 'requires_subscription',
            'is_premium', 'price', 'thumbnail',
        ]