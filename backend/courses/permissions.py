from rest_framework import permissions
from subscriptions.models import Subscription


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
    """Students must have an active subscription to access course content.
    Instructors and admins bypass this check."""

    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if user.role in ['INSTRUCTOR', 'ADMIN']:
            return True
        return Subscription.objects.filter(student=user, status='ACTIVE').exists() and any(
            sub.is_active for sub in Subscription.objects.filter(student=user, status='ACTIVE')
        )