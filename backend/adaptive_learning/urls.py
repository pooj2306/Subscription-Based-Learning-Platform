from django.urls import path
from .views import (
    TopicListCreateView,
    AdaptiveQuestionDetailView,
    BulkSetAdaptiveMetaView,
    InstructorQuizQuestionsView,
    AdaptiveQuizView,
    SubmitAdaptiveQuizView,
    InteractiveAdaptiveStartView,
    InteractiveAdaptiveAnswerView,
    TopicStrengthDashboardView,
    WeakTopicPracticeView,
    SubmitWeakPracticeView,
    SpacedRepetitionDueView,
    SpacedRepetitionAllView,
    SubmitSpacedReviewView,
    SimulateSpacedDaysView,
    MyDifficultyLevelView,
)

urlpatterns = [
    # Topics
    path('topics/course/<int:course_id>/', TopicListCreateView.as_view(), name='topic-list-create'),

    # Adaptive question metadata
    path('question/<int:question_id>/meta/', AdaptiveQuestionDetailView.as_view(), name='adaptive-question-meta'),
    path('questions/bulk-meta/', BulkSetAdaptiveMetaView.as_view(), name='adaptive-bulk-meta'),
    path('instructor/quiz/<int:quiz_id>/questions/', InstructorQuizQuestionsView.as_view(), name='instructor-quiz-questions'),

    # Adaptive quiz (Batch mode)
    path('quiz/<int:quiz_id>/adaptive/', AdaptiveQuizView.as_view(), name='adaptive-quiz'),
    path('quiz/<int:quiz_id>/adaptive/submit/', SubmitAdaptiveQuizView.as_view(), name='adaptive-quiz-submit'),

    # Real-Time Interactive Adaptive Quiz
    path('quiz/<int:quiz_id>/interactive/start/', InteractiveAdaptiveStartView.as_view(), name='interactive-adaptive-start'),
    path('quiz/<int:quiz_id>/interactive/answer/', InteractiveAdaptiveAnswerView.as_view(), name='interactive-adaptive-answer'),

    # Topic strength dashboard
    path('strengths/', TopicStrengthDashboardView.as_view(), name='topic-strengths'),
    path('strengths/course/<int:course_id>/', TopicStrengthDashboardView.as_view(), name='topic-strengths-course'),

    # Weak-topic practice
    path('practice/', WeakTopicPracticeView.as_view(), name='weak-topic-practice'),
    path('practice/course/<int:course_id>/', WeakTopicPracticeView.as_view(), name='weak-topic-practice-course'),
    path('practice/submit/', SubmitWeakPracticeView.as_view(), name='weak-topic-practice-submit'),

    # Spaced repetition
    path('spaced/due/', SpacedRepetitionDueView.as_view(), name='sr-due'),
    path('spaced/all/', SpacedRepetitionAllView.as_view(), name='sr-all'),
    path('spaced/review/', SubmitSpacedReviewView.as_view(), name='sr-review'),
    path('spaced/simulate-days/', SimulateSpacedDaysView.as_view(), name='sr-simulate-days'),

    # Difficulty levels
    path('my-levels/', MyDifficultyLevelView.as_view(), name='my-difficulty-levels'),
]
