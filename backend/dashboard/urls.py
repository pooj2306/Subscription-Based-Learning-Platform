from django.urls import path
from .views import (
    UserStatsView, SubscriptionRevenueStatsView,
    CourseEngagementStatsView, QuizStatsView, SystemOverviewView,
)

urlpatterns = [
    path('overview/', SystemOverviewView.as_view(), name='dashboard-overview'),
    path('users/', UserStatsView.as_view(), name='dashboard-users'),
    path('revenue/', SubscriptionRevenueStatsView.as_view(), name='dashboard-revenue'),
    path('courses/', CourseEngagementStatsView.as_view(), name='dashboard-courses'),
    path('quizzes/', QuizStatsView.as_view(), name='dashboard-quizzes'),
]