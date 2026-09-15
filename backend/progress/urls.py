from django.urls import path
from .views import (
    UpdateLessonProgressView,
    MyCourseProgressListView,
    MyCourseProgressDetailView,
    MyLessonProgressListView,
)

urlpatterns = [
    path('update/', UpdateLessonProgressView.as_view(), name='update-progress'),
    path('my/', MyCourseProgressListView.as_view(), name='my-course-progress-list'),
    path('my/<int:course_id>/', MyCourseProgressDetailView.as_view(), name='my-course-progress-detail'),
    path('my/<int:course_id>/lessons/', MyLessonProgressListView.as_view(), name='my-lesson-progress-list'),
]