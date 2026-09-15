from django.shortcuts import render

# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Sum, Count, Avg
from courses.models import Course
from subscriptions.models import Subscription, Plan
from progress.models import CourseProgress
from assessments.models import QuizAttempt
from .permissions import IsAdmin

User = get_user_model()


class UserStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        data = {
            "total_users": User.objects.count(),
            "total_students": User.objects.filter(role='STUDENT').count(),
            "total_instructors": User.objects.filter(role='INSTRUCTOR').count(),
            "total_admins": User.objects.filter(role='ADMIN').count(),
        }
        return Response(data)


class SubscriptionRevenueStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        total_revenue = Subscription.objects.aggregate(total=Sum('amount_paid'))['total'] or 0
        active_subs = Subscription.objects.filter(status='ACTIVE').count()
        expired_subs = Subscription.objects.filter(status='EXPIRED').count()
        cancelled_subs = Subscription.objects.filter(status='CANCELLED').count()

        by_plan = list(
            Subscription.objects.values('plan__name').annotate(
                count=Count('id'),
                revenue=Sum('amount_paid'),
            )
        )

        data = {
            "total_revenue": total_revenue,
            "active_subscriptions": active_subs,
            "expired_subscriptions": expired_subs,
            "cancelled_subscriptions": cancelled_subs,
            "revenue_by_plan": by_plan,
        }
        return Response(data)


class CourseEngagementStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        courses = Course.objects.annotate(
            total_enrollments=Count('progress_entries', distinct=True),
        )

        data = []
        for course in courses:
            avg_progress = CourseProgress.objects.filter(course=course).aggregate(
                avg=Avg('progress_percent')
            )['avg'] or 0
            completed_count = CourseProgress.objects.filter(course=course, is_course_completed=True).count()

            data.append({
                "course_id": course.id,
                "course_title": course.title,
                "instructor": course.instructor.username,
                "total_enrollments": course.total_enrollments,
                "average_progress_percent": round(avg_progress, 2),
                "completed_count": completed_count,
            })

        return Response(data)


class QuizStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        total_attempts = QuizAttempt.objects.count()
        passed = QuizAttempt.objects.filter(passed=True).count()
        avg_score = QuizAttempt.objects.aggregate(avg=Avg('percentage'))['avg'] or 0

        data = {
            "total_quiz_attempts": total_attempts,
            "passed_attempts": passed,
            "failed_attempts": total_attempts - passed,
            "average_score_percent": round(avg_score, 2),
        }
        return Response(data)


class SystemOverviewView(APIView):
    """Combined snapshot for the main admin dashboard landing page."""
    permission_classes = [IsAdmin]

    def get(self, request):
        data = {
            "total_users": User.objects.count(),
            "total_courses": Course.objects.count(),
            "total_active_subscriptions": Subscription.objects.filter(status='ACTIVE').count(),
            "total_revenue": Subscription.objects.aggregate(total=Sum('amount_paid'))['total'] or 0,
            "total_quiz_attempts": QuizAttempt.objects.count(),
        }
        return Response(data)