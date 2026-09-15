from rest_framework import serializers
from .models import Plan, Subscription


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = ['id', 'name', 'description', 'price', 'duration_days', 'is_active']


class SubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    student_name = serializers.CharField(source='student.username', read_only=True)
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = Subscription
        fields = [
            'id', 'student', 'student_name', 'plan', 'plan_name',
            'status', 'start_date', 'end_date', 'amount_paid',
            'payment_reference', 'is_active', 'created_at',
        ]
        read_only_fields = ['student', 'status', 'start_date', 'end_date']


class SubscribeSerializer(serializers.Serializer):
    """Used when a student purchases a plan."""
    plan_id = serializers.IntegerField()

    def validate_plan_id(self, value):
        try:
            plan = Plan.objects.get(id=value, is_active=True)
        except Plan.DoesNotExist:
            raise serializers.ValidationError("Invalid or inactive plan.")
        return value