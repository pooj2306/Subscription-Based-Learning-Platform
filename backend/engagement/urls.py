from django.urls import path
from .views import (
    MyGamificationProfileView,
    AllBadgesView,
    LeaderboardView,
    StudyGroupListCreateView,
    StudyGroupDetailView,
    JoinStudyGroupView,
    LeaveStudyGroupView,
    PostStudyGroupMessageView,
    RoadmapListView,
    RoadmapDetailView,
    RecordFocusSessionView,
    RecentFocusSessionsView,
)

urlpatterns = [
    # Gamification
    path('profile/', MyGamificationProfileView.as_view(), name='engagement-profile'),
    path('badges/', AllBadgesView.as_view(), name='engagement-badges'),
    path('leaderboard/', LeaderboardView.as_view(), name='engagement-leaderboard'),

    # Study Groups
    path('groups/', StudyGroupListCreateView.as_view(), name='engagement-groups-list-create'),
    path('groups/<int:pk>/', StudyGroupDetailView.as_view(), name='engagement-group-detail'),
    path('groups/<int:pk>/join/', JoinStudyGroupView.as_view(), name='engagement-group-join'),
    path('groups/<int:pk>/leave/', LeaveStudyGroupView.as_view(), name='engagement-group-leave'),
    path('groups/<int:pk>/message/', PostStudyGroupMessageView.as_view(), name='engagement-group-message'),

    # Roadmaps & Skill Trees
    path('roadmaps/', RoadmapListView.as_view(), name='engagement-roadmaps'),
    path('roadmaps/<slug:slug>/', RoadmapDetailView.as_view(), name='engagement-roadmap-detail'),

    # Focus Mode (Pomodoro)
    path('focus/record/', RecordFocusSessionView.as_view(), name='engagement-focus-record'),
    path('focus/recent/', RecentFocusSessionsView.as_view(), name='engagement-focus-recent'),
]
