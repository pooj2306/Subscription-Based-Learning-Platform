from django.urls import path
from .views import QuizListCreateView, QuizTakeView, SubmitQuizView, MyQuizAttemptsView

urlpatterns = [
    path('course/<int:course_id>/quizzes/', QuizListCreateView.as_view(), name='quiz-list-create'),
    path('<int:pk>/take/', QuizTakeView.as_view(), name='quiz-take'),
    path('<int:pk>/submit/', SubmitQuizView.as_view(), name='quiz-submit'),
    path('my-attempts/', MyQuizAttemptsView.as_view(), name='my-quiz-attempts'),
]