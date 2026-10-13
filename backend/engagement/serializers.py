from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    GamificationProfile,
    Badge,
    EarnedBadge,
    XPTransaction,
    StudyGroup,
    StudyGroupMembership,
    StudyGroupMessage,
    Roadmap,
    RoadmapNode,
    FocusSession,
)
from courses.serializers import CourseSerializer

User = get_user_model()


# ──────────────────────────────────────────────
# 1. Profile, XP & Badges
# ──────────────────────────────────────────────

class BadgeSerializer(models_serializer := serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ['id', 'code', 'title', 'description', 'icon', 'category', 'xp_reward']


class EarnedBadgeSerializer(serializers.ModelSerializer):
    badge = BadgeSerializer(read_only=True)

    class Meta:
        model = EarnedBadge
        fields = ['id', 'badge', 'earned_at']


class XPTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = XPTransaction
        fields = ['id', 'amount', 'reason', 'created_at']


class GamificationProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='student.username', read_only=True)
    level_title = serializers.CharField(read_only=True)
    xp_current_level_progress = serializers.IntegerField(read_only=True)
    xp_needed_for_next_level = serializers.IntegerField(read_only=True)
    level_progress_percent = serializers.FloatField(read_only=True)
    earned_badges = EarnedBadgeSerializer(source='student.earned_badges', many=True, read_only=True)
    recent_transactions = serializers.SerializerMethodField()

    class Meta:
        model = GamificationProfile
        fields = [
            'id', 'username', 'xp', 'level', 'level_title',
            'current_streak', 'longest_streak', 'total_focus_minutes',
            'xp_current_level_progress', 'xp_needed_for_next_level',
            'level_progress_percent', 'last_activity_date',
            'earned_badges', 'recent_transactions',
        ]
        read_only_fields = fields

    def get_recent_transactions(self, obj):
        txs = XPTransaction.objects.filter(student=obj.student).order_by('-created_at')[:5]
        return XPTransactionSerializer(txs, many=True).data


# ──────────────────────────────────────────────
# 2. Leaderboard
# ──────────────────────────────────────────────

class LeaderboardEntrySerializer(serializers.Serializer):
    rank = serializers.IntegerField()
    user_id = serializers.IntegerField()
    username = serializers.CharField()
    xp = serializers.IntegerField()
    level = serializers.IntegerField()
    level_title = serializers.CharField()
    current_streak = serializers.IntegerField()
    total_focus_minutes = serializers.IntegerField()
    badge_count = serializers.IntegerField()
    is_current_user = serializers.BooleanField(default=False)


# ──────────────────────────────────────────────
# 3. Study Groups
# ──────────────────────────────────────────────

class StudyGroupMembershipSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='student.username', read_only=True)
    level = serializers.IntegerField(source='student.gamification.level', read_only=True)
    current_streak = serializers.IntegerField(source='student.gamification.current_streak', read_only=True)

    class Meta:
        model = StudyGroupMembership
        fields = [
            'id', 'username', 'role',
            'weekly_contributed_xp', 'weekly_contributed_minutes',
            'level', 'current_streak', 'joined_at',
        ]


class StudyGroupMessageSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = StudyGroupMessage
        fields = ['id', 'username', 'content', 'created_at']


class StudyGroupSerializer(serializers.ModelSerializer):
    member_count = serializers.IntegerField(read_only=True)
    current_weekly_xp = serializers.IntegerField(read_only=True)
    current_weekly_focus_minutes = serializers.IntegerField(read_only=True)
    goal_progress_percent = serializers.FloatField(read_only=True)
    is_member = serializers.SerializerMethodField()
    my_contribution_xp = serializers.SerializerMethodField()

    class Meta:
        model = StudyGroup
        fields = [
            'id', 'name', 'description', 'icon', 'color_theme',
            'weekly_goal_title', 'target_weekly_xp', 'target_weekly_focus_minutes',
            'current_weekly_xp', 'current_weekly_focus_minutes', 'goal_progress_percent',
            'member_count', 'is_member', 'my_contribution_xp', 'created_at',
        ]

    def get_is_member(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.memberships.filter(student=request.user).exists()

    def get_my_contribution_xp(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        mem = obj.memberships.filter(student=request.user).first()
        return mem.weekly_contributed_xp if mem else 0


class StudyGroupDetailSerializer(StudyGroupSerializer):
    memberships = StudyGroupMembershipSerializer(many=True, read_only=True)
    messages = StudyGroupMessageSerializer(many=True, read_only=True)

    class Meta(StudyGroupSerializer.Meta):
        fields = StudyGroupSerializer.Meta.fields + ['memberships', 'messages']


# ──────────────────────────────────────────────
# 4. Roadmaps & Visual Skill Trees
# ──────────────────────────────────────────────

class RoadmapNodeSerializer(serializers.ModelSerializer):
    course_id = serializers.IntegerField(source='course.id', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)
    course_level = serializers.CharField(source='course.level', read_only=True)
    total_lessons = serializers.IntegerField(source='course.lessons.count', read_only=True)
    is_unlocked = serializers.SerializerMethodField()
    is_completed = serializers.SerializerMethodField()
    progress_percent = serializers.SerializerMethodField()
    prerequisite_node_ids = serializers.SerializerMethodField()
    prerequisite_titles = serializers.SerializerMethodField()

    class Meta:
        model = RoadmapNode
        fields = [
            'id', 'stage_order', 'course_id', 'course_title', 'course_level',
            'total_lessons', 'skill_tag', 'short_description', 'reward_xp', 'icon',
            'is_unlocked', 'is_completed', 'progress_percent',
            'prerequisite_node_ids', 'prerequisite_titles',
        ]

    def get_is_unlocked(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return obj.prerequisites.count() == 0
        return obj.is_unlocked_for_student(request.user)

    def get_is_completed(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.is_completed_for_student(request.user)

    def get_progress_percent(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0.0
        return obj.get_progress_for_student(request.user)

    def get_prerequisite_node_ids(self, obj):
        return list(obj.prerequisites.values_list('id', flat=True))

    def get_prerequisite_titles(self, obj):
        return list(obj.prerequisites.values_list('course__title', flat=True))


class RoadmapSerializer(serializers.ModelSerializer):
    total_stages = serializers.IntegerField(source='nodes.count', read_only=True)
    completed_stages = serializers.SerializerMethodField()

    class Meta:
        model = Roadmap
        fields = [
            'id', 'title', 'slug', 'tagline', 'description', 'icon',
            'category', 'color_gradient', 'total_stages', 'completed_stages',
        ]

    def get_completed_stages(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        nodes = obj.nodes.all()
        return sum(1 for n in nodes if n.is_completed_for_student(request.user))


class RoadmapDetailSerializer(RoadmapSerializer):
    nodes = RoadmapNodeSerializer(many=True, read_only=True)

    class Meta(RoadmapSerializer.Meta):
        fields = RoadmapSerializer.Meta.fields + ['nodes']


# ──────────────────────────────────────────────
# 5. Focus Mode & Pomodoro Sessions
# ──────────────────────────────────────────────

class FocusSessionSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)

    class Meta:
        model = FocusSession
        fields = [
            'id', 'duration_minutes', 'mode', 'notes',
            'course', 'course_title', 'lesson', 'lesson_title',
            'xp_earned', 'completed_at',
        ]
        read_only_fields = ['id', 'xp_earned', 'completed_at']


class RecordFocusSessionSerializer(serializers.Serializer):
    duration_minutes = serializers.IntegerField(default=25, min_value=1)
    mode = serializers.ChoiceField(choices=FocusSession.Mode.choices, default=FocusSession.Mode.POMODORO)
    course_id = serializers.IntegerField(required=False, allow_null=True)
    lesson_id = serializers.IntegerField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, default='')
