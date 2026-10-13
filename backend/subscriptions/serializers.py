from rest_framework import serializers
from .models import Plan, Subscription, CoursePurchase, StudentVerification
from courses.models import Course


class PlanSerializer(serializers.ModelSerializer):
    effective_price = serializers.SerializerMethodField()

    class Meta:
        model = Plan
        fields = [
            'id', 'name', 'description', 'price', 'duration_days',
            'plan_type', 'discount_percentage', 'is_active', 'effective_price',
        ]

    def get_effective_price(self, obj):
        request = self.context.get('request')
        # If student is verified and this is a standard plan, they could receive student discount
        if request and request.user and request.user.is_authenticated:
            verification = getattr(request.user, 'student_verification', None)
            if verification and verification.status == StudentVerification.Status.VERIFIED and obj.plan_type == Plan.PlanType.STANDARD:
                discount = (obj.price * verification.discount_rate) / 100
                return round(float(obj.price - discount), 2)
        return float(obj.price)


class SubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.SerializerMethodField()
    student_name = serializers.CharField(source='student.username', read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    can_pause = serializers.SerializerMethodField()
    can_resume = serializers.SerializerMethodField()

    class Meta:
        model = Subscription
        fields = [
            'id', 'student', 'student_name', 'plan', 'plan_name',
            'status', 'start_date', 'end_date', 'is_trial',
            'paused_at', 'remaining_days_at_pause', 'amount_paid',
            'payment_reference', 'is_active', 'can_pause', 'can_resume',
            'created_at',
        ]
        read_only_fields = ['student', 'status', 'start_date', 'end_date', 'is_trial', 'paused_at', 'remaining_days_at_pause']

    def get_plan_name(self, obj):
        if obj.plan:
            return obj.plan.name
        if obj.is_trial:
            return "7-Day Free Trial"
        return "Custom Plan"

    def get_can_pause(self, obj):
        return obj.status == Subscription.Status.ACTIVE and obj.is_active

    def get_can_resume(self, obj):
        return obj.status == Subscription.Status.PAUSED


class SubscribeSerializer(serializers.Serializer):
    """Used when a student purchases a plan."""
    plan_id = serializers.IntegerField()

    def validate_plan_id(self, value):
        try:
            plan = Plan.objects.get(id=value, is_active=True)
        except Plan.DoesNotExist:
            raise serializers.ValidationError("Invalid or inactive plan.")
        return value


class CoursePurchaseSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)
    course_thumbnail = serializers.ImageField(source='course.thumbnail', read_only=True)
    stream = serializers.CharField(source='course.stream', read_only=True)
    level = serializers.CharField(source='course.level', read_only=True)
    instructor_name = serializers.CharField(source='course.instructor.username', read_only=True)
    lessons_count = serializers.IntegerField(source='course.lessons.count', read_only=True)
    has_access = serializers.SerializerMethodField()
    is_subscription_paused = serializers.SerializerMethodField()

    class Meta:
        model = CoursePurchase
        fields = [
            'id', 'student', 'course', 'course_title',
            'course_thumbnail', 'stream', 'level',
            'instructor_name', 'lessons_count',
            'amount_paid', 'payment_reference', 'purchased_at',
            'has_access', 'is_subscription_paused',
        ]
        read_only_fields = ['student', 'amount_paid', 'payment_reference', 'purchased_at']

    def get_has_access(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None) or obj.student
        if not user or not user.is_authenticated:
            return True
        from django.conf import settings
        from subscriptions.models import Subscription
        has_active_sub = Subscription.objects.filter(student=user, status='ACTIVE').exists() and any(
            sub.is_active for sub in Subscription.objects.filter(student=user, status='ACTIVE')
        )
        has_paused_sub = Subscription.objects.filter(student=user, status=Subscription.Status.PAUSED).exists()
        pause_stops_owned = getattr(settings, 'PAUSE_STOPS_OWNED_COURSE_ACCESS', True)
        if has_paused_sub and not has_active_sub and pause_stops_owned:
            return False
        return True

    def get_is_subscription_paused(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None) or obj.student
        if not user or not user.is_authenticated:
            return False
        from subscriptions.models import Subscription
        has_active_sub = Subscription.objects.filter(student=user, status='ACTIVE').exists() and any(
            sub.is_active for sub in Subscription.objects.filter(student=user, status='ACTIVE')
        )
        return Subscription.objects.filter(student=user, status=Subscription.Status.PAUSED).exists() and not has_active_sub


class StudentVerificationSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source='student.username', read_only=True)

    class Meta:
        model = StudentVerification
        fields = [
            'id', 'student_username', 'institution_name', 'student_id_number',
            'student_email', 'document_name', 'status', 'discount_rate',
            'verified_at', 'created_at',
        ]
        read_only_fields = ['status', 'discount_rate', 'verified_at', 'created_at']