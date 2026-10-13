from rest_framework import serializers
from .models import (
    Topic, AdaptiveQuestion, StudentDifficultyLevel,
    StudentTopicScore, SpacedRepetitionCard, SPACED_INTERVALS,
)
from assessments.serializers import QuestionStudentViewSerializer


# ──── Topic ────

class TopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = ['id', 'name', 'course']


# ──── Adaptive Question metadata ────

class AdaptiveQuestionSerializer(serializers.ModelSerializer):
    topic_name = serializers.CharField(source='topic.name', read_only=True)

    class Meta:
        model = AdaptiveQuestion
        fields = ['id', 'question', 'difficulty', 'topic', 'topic_name']


# ──── Student difficulty level ────

class StudentDifficultyLevelSerializer(serializers.ModelSerializer):
    level_display = serializers.CharField(
        source='get_current_level_display', read_only=True,
    )

    class Meta:
        model = StudentDifficultyLevel
        fields = [
            'id', 'quiz', 'current_level', 'level_display',
            'consecutive_correct', 'consecutive_wrong',
        ]
        read_only_fields = fields


# ──── Topic strength / weakness ────

class StudentTopicScoreSerializer(serializers.ModelSerializer):
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    accuracy = serializers.FloatField(read_only=True)
    strength_label = serializers.CharField(read_only=True)
    elo_tier = serializers.CharField(read_only=True)

    class Meta:
        model = StudentTopicScore
        fields = [
            'id', 'topic', 'topic_name',
            'total_attempted', 'total_correct',
            'accuracy', 'strength_label',
            'elo_rating', 'elo_tier',
        ]
        read_only_fields = fields


# ──── Spaced repetition ────

class SpacedRepetitionCardSerializer(serializers.ModelSerializer):
    question_detail = QuestionStudentViewSerializer(source='question', read_only=True)
    is_due = serializers.BooleanField(read_only=True)
    days_until_review = serializers.SerializerMethodField()

    class Meta:
        model = SpacedRepetitionCard
        fields = [
            'id', 'question', 'question_detail',
            'next_review_date', 'interval_index',
            'is_due', 'is_retired', 'days_until_review',
        ]
        read_only_fields = fields

    def get_days_until_review(self, obj):
        from django.utils import timezone
        delta = obj.next_review_date - timezone.now().date()
        return max(delta.days, 0)


# ──── Adaptive quiz submission ────

class AdaptiveAnswerSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    choice_id = serializers.IntegerField()


class AdaptiveQuizSubmitSerializer(serializers.Serializer):
    answers = AdaptiveAnswerSerializer(many=True)


# ──── Spaced repetition review submission ────

class ReviewAnswerSerializer(serializers.Serializer):
    card_id = serializers.IntegerField()
    choice_id = serializers.IntegerField()


class SpacedReviewSubmitSerializer(serializers.Serializer):
    answers = ReviewAnswerSerializer(many=True)


# ──── Interactive adaptive & practice quiz serializers ────

class ChoiceStudentViewSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    text = serializers.CharField()


class AdaptiveQuestionStudentViewSerializer(serializers.ModelSerializer):
    choices = serializers.SerializerMethodField()
    difficulty = serializers.SerializerMethodField()
    difficulty_display = serializers.SerializerMethodField()
    topic_name = serializers.SerializerMethodField()

    class Meta:
        from assessments.models import Question
        model = Question
        fields = ['id', 'text', 'order', 'marks', 'choices', 'difficulty', 'difficulty_display', 'topic_name']

    def get_choices(self, obj):
        return [{'id': c.id, 'text': c.text} for c in obj.choices.all()]

    def get_difficulty(self, obj):
        try:
            return obj.adaptive_meta.difficulty
        except Exception:
            return 2

    def get_difficulty_display(self, obj):
        try:
            return obj.adaptive_meta.get_difficulty_display()
        except Exception:
            return "Medium"

    def get_topic_name(self, obj):
        try:
            return obj.adaptive_meta.topic.name if obj.adaptive_meta.topic else None
        except Exception:
            return None


class QuestionWithAdaptiveMetaSerializer(serializers.ModelSerializer):
    choices = serializers.SerializerMethodField()
    difficulty = serializers.SerializerMethodField()
    topic = serializers.SerializerMethodField()
    topic_name = serializers.SerializerMethodField()

    class Meta:
        from assessments.models import Question
        model = Question
        fields = ['id', 'quiz', 'text', 'order', 'marks', 'choices', 'difficulty', 'topic', 'topic_name']

    def get_choices(self, obj):
        return [{'id': c.id, 'text': c.text, 'is_correct': c.is_correct} for c in obj.choices.all()]

    def get_difficulty(self, obj):
        try:
            return obj.adaptive_meta.difficulty
        except Exception:
            return 2

    def get_topic(self, obj):
        try:
            return obj.adaptive_meta.topic_id
        except Exception:
            return None

    def get_topic_name(self, obj):
        try:
            return obj.adaptive_meta.topic.name if obj.adaptive_meta.topic else None
        except Exception:
            return None


class InteractiveAnswerSubmitSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    choice_id = serializers.IntegerField()
    session_history = serializers.ListField(
        child=serializers.DictField(), required=False, default=list
    )


class PracticeQuizSubmitSerializer(serializers.Serializer):
    answers = AdaptiveAnswerSerializer(many=True)


class SimulateDaysSerializer(serializers.Serializer):
    days = serializers.IntegerField(default=1, min_value=1, max_value=30)
