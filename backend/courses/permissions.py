from django.conf import settings
from rest_framework import permissions
from subscriptions.models import Subscription, CoursePurchase
from courses.models import Course, Lesson


class IsInstructorOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role in ['INSTRUCTOR', 'ADMIN']


class IsOwnerInstructorOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.user.role == 'ADMIN':
            return True
        return obj.instructor == request.user


class HasActiveSubscription(permissions.BasePermission):
    """Students must have an active subscription or a pay-per-course purchase to access course content.
    Instructors and admins bypass this check.
    When a student's subscription is paused, access to owned/purchased courses is stopped."""

    def _get_course_id(self, view):
        course_id = view.kwargs.get('course_id')
        if not course_id:
            lesson_id = view.kwargs.get('lesson_id')
            if lesson_id:
                course_id = Lesson.objects.filter(id=lesson_id).values_list('course_id', flat=True).first()
            elif 'pk' in view.kwargs:
                pk_val = view.kwargs.get('pk')
                model = getattr(getattr(view, 'queryset', None), 'model', None)
                if model and model.__name__ == 'Lesson':
                    course_id = Lesson.objects.filter(id=pk_val).values_list('course_id', flat=True).first()
                elif model and model.__name__ == 'Course':
                    course_id = pk_val
                elif model and model.__name__ == 'Quiz':
                    from assessments.models import Quiz
                    course_id = Quiz.objects.filter(id=pk_val).values_list('course_id', flat=True).first()
                else:
                    # Check if pk belongs to a Course, Lesson, or Quiz
                    if Course.objects.filter(id=pk_val).exists():
                        course_id = pk_val
                    elif Lesson.objects.filter(id=pk_val).exists():
                        course_id = Lesson.objects.filter(id=pk_val).values_list('course_id', flat=True).first()
                    else:
                        from assessments.models import Quiz
                        course_id = Quiz.objects.filter(id=pk_val).values_list('course_id', flat=True).first()
        return course_id

    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if user.role in ['INSTRUCTOR', 'ADMIN']:
            return True

        course_id = self._get_course_id(view)
        course = Course.objects.filter(id=course_id).first() if course_id else None

        # Free courses that do not require subscription are accessible
        if course and not course.requires_subscription:
            return True

        # Check active subscription
        active_sub = Subscription.objects.filter(student=user, status='ACTIVE').exists() and any(
            sub.is_active for sub in Subscription.objects.filter(student=user, status='ACTIVE')
        )

        # Check paused subscription
        has_paused_sub = Subscription.objects.filter(student=user, status=Subscription.Status.PAUSED).exists()
        pause_stops_owned = getattr(settings, 'PAUSE_STOPS_OWNED_COURSE_ACCESS', True)

        # If student's subscription is paused and they don't have another active subscription,
        # access to owned/purchased courses is stopped.
        if has_paused_sub and not active_sub and pause_stops_owned:
            return False

        if active_sub:
            return True

        # Check pay-per-course purchase for active (non-paused) users
        if course_id and CoursePurchase.objects.filter(student=user, course_id=course_id).exists():
            return True

        return False