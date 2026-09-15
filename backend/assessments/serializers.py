from rest_framework import serializers
from .models import Quiz, Question, Choice, QuizAttempt, StudentAnswer


class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'text', 'is_correct']


class ChoiceStudentViewSerializer(serializers.ModelSerializer):
    """Hides is_correct from students taking the quiz."""
    class Meta:
        model = Choice
        fields = ['id', 'text']


class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'quiz', 'text', 'order', 'marks', 'choices']


class QuestionStudentViewSerializer(serializers.ModelSerializer):
    choices = ChoiceStudentViewSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'text', 'order', 'marks', 'choices']


class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = [
            'id', 'course', 'lesson', 'title', 'description',
            'pass_percentage', 'is_active', 'created_by', 'questions', 'created_at',
        ]
        read_only_fields = ['created_by']


class QuizStudentViewSerializer(serializers.ModelSerializer):
    """What a student sees when taking the quiz - no correct answers exposed."""
    questions = QuestionStudentViewSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = ['id', 'title', 'description', 'pass_percentage', 'questions']


class SubmitAnswerSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    choice_id = serializers.IntegerField()


class SubmitQuizSerializer(serializers.Serializer):
    answers = SubmitAnswerSerializer(many=True)


class StudentAnswerResultSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.text', read_only=True)
    selected_choice_text = serializers.CharField(source='selected_choice.text', read_only=True)

    class Meta:
        model = StudentAnswer
        fields = ['question_text', 'selected_choice_text', 'is_correct']


class QuizAttemptResultSerializer(serializers.ModelSerializer):
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    answers = StudentAnswerResultSerializer(many=True, read_only=True)

    class Meta:
        model = QuizAttempt
        fields = ['id', 'quiz', 'quiz_title', 'score', 'total_marks', 'percentage', 'passed', 'submitted_at', 'answers']