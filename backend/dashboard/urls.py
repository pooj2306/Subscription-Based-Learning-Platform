from django.urls import path
from .views import (
    UserStatsView, SubscriptionRevenueStatsView,
    CourseEngagementStatsView, QuizStatsView, SystemOverviewView,
    StudentAnalyticsView, InstructorAnalyticsView,
    IndustryTrendsView, SupportTicketView,
)

urlpatterns = [
    path('overview/', SystemOverviewView.as_view(), name='dashboard-overview'),
    path('users/', UserStatsView.as_view(), name='dashboard-users'),
    path('revenue/', SubscriptionRevenueStatsView.as_view(), name='dashboard-revenue'),
    path('courses/', CourseEngagementStatsView.as_view(), name='dashboard-courses'),
    path('quizzes/', QuizStatsView.as_view(), name='dashboard-quizzes'),

    # Advanced Analytics
    path('analytics/student/', StudentAnalyticsView.as_view(), name='dashboard-student-analytics'),
    path('analytics/instructor/', InstructorAnalyticsView.as_view(), name='dashboard-instructor-analytics'),

    # Trending Programs, Projects & Essential Tools Radar
    path('industry-trends/', IndustryTrendsView.as_view(), name='dashboard-industry-trends'),

    # Help Desk Support Tickets
    path('support-tickets/', SupportTicketView.as_view(), name='dashboard-support-tickets'),
]