from django.shortcuts import render

# Create your views here.
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from django.shortcuts import get_object_or_404
from courses.models import Lesson
from .models import LessonProgress, CourseProgress
from .serializers import LessonProgressSerializer, UpdateProgressSerializer, CourseProgressSerializer


class UpdateLessonProgressView(APIView):
    """Student calls this to save watch position and/or mark a lesson complete."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = UpdateProgressSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        lesson = get_object_or_404(Lesson, id=data['lesson_id'])

        if lesson.course.requires_subscription and request.user.role == 'STUDENT':
            from django.conf import settings
            from subscriptions.models import Subscription, CoursePurchase

            has_active_sub = Subscription.objects.filter(student=request.user, status='ACTIVE').exists() and any(
                sub.is_active for sub in Subscription.objects.filter(student=request.user, status='ACTIVE')
            )
            has_paused_sub = Subscription.objects.filter(student=request.user, status=Subscription.Status.PAUSED).exists()
            pause_stops_owned = getattr(settings, 'PAUSE_STOPS_OWNED_COURSE_ACCESS', True)

            if has_paused_sub and not has_active_sub and pause_stops_owned:
                return Response(
                    {"detail": "Your subscription is currently paused. Please resume your subscription to update course progress."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            if not has_active_sub and not CoursePurchase.objects.filter(student=request.user, course=lesson.course).exists():
                return Response(
                    {"detail": "An active subscription or course purchase is required to update progress."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        progress, _ = LessonProgress.objects.get_or_create(
            student=request.user,
            lesson=lesson,
        )
        progress.last_watched_position_seconds = data.get('last_watched_position_seconds', progress.last_watched_position_seconds)

        if data.get('is_completed') and not progress.is_completed:
            progress.is_completed = True
            progress.completed_at = timezone.now()

        progress.save()

        # Keep the course-level summary in sync
        course_progress, _ = CourseProgress.objects.get_or_create(
            student=request.user,
            course=lesson.course,
        )
        course_progress.recalculate()

        return Response(LessonProgressSerializer(progress).data, status=status.HTTP_200_OK)


class MyCourseProgressListView(generics.ListAPIView):
    """Student's progress summary across all courses they've started."""
    serializer_class = CourseProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CourseProgress.objects.filter(student=self.request.user)


class MyCourseProgressDetailView(generics.RetrieveAPIView):
    """Student's progress summary for one specific course."""
    serializer_class = CourseProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        course_id = self.kwargs['course_id']
        return get_object_or_404(CourseProgress, student=self.request.user, course_id=course_id)


class MyLessonProgressListView(generics.ListAPIView):
    """Student's per-lesson progress within one course (for resume/pause UI)."""
    serializer_class = LessonProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        course_id = self.kwargs['course_id']
        return LessonProgress.objects.filter(student=self.request.user, lesson__course_id=course_id)