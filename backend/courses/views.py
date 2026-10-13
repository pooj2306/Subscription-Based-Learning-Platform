from django.shortcuts import render
from .permissions import IsInstructorOrAdmin, IsOwnerInstructorOrAdmin, HasActiveSubscription
# Create your views here.
from rest_framework import generics, permissions
from .models import Course, Lesson, Material
from .serializers import (
    CourseSerializer, CourseCreateUpdateSerializer,
    LessonSerializer, MaterialSerializer,
)
from .permissions import IsInstructorOrAdmin, IsOwnerInstructorOrAdmin


class CourseListCreateView(generics.ListCreateAPIView):
    queryset = Course.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsInstructorOrAdmin]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CourseCreateUpdateSerializer
        return CourseSerializer

    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)


class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Course.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerInstructorOrAdmin]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return CourseCreateUpdateSerializer
        return CourseSerializer


class LessonListCreateView(generics.ListCreateAPIView):
    serializer_class = LessonSerializer

    def get_queryset(self):
        course_id = self.kwargs['course_id']
        return Lesson.objects.filter(course_id=course_id)

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), IsInstructorOrAdmin()]
        return [permissions.IsAuthenticated(), HasActiveSubscription()]

    def perform_create(self, serializer):
        course_id = self.kwargs['course_id']
        serializer.save(course_id=course_id)


class LessonDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsInstructorOrAdmin]


class MaterialListCreateView(generics.ListCreateAPIView):
    serializer_class = MaterialSerializer

    def get_queryset(self):
        lesson_id = self.kwargs['lesson_id']
        return Material.objects.filter(lesson_id=lesson_id)

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), IsInstructorOrAdmin()]
        return [permissions.IsAuthenticated(), HasActiveSubscription()]

    def perform_create(self, serializer):
        lesson_id = self.kwargs['lesson_id']
        serializer.save(lesson_id=lesson_id)
