from django.shortcuts import render

# Create your views here.
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Quiz, QuizAttempt
from .serializers import (
    QuizSerializer, QuizStudentViewSerializer,
    SubmitQuizSerializer, QuizAttemptResultSerializer,
)
from .grading import grade_quiz_attempt
from courses.permissions import IsInstructorOrAdmin, HasActiveSubscription


class QuizListCreateView(generics.ListCreateAPIView):
    serializer_class = QuizSerializer

    def get_queryset(self):
        course_id = self.kwargs.get('course_id')
        return Quiz.objects.filter(course_id=course_id, is_active=True)

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), IsInstructorOrAdmin()]
        return [permissions.IsAuthenticated(), HasActiveSubscription()]

    def perform_create(self, serializer):
        course_id = self.kwargs['course_id']
        serializer.save(course_id=course_id, created_by=self.request.user)


class QuizTakeView(generics.RetrieveAPIView):
    """Student view of a quiz - no correct answers shown."""
    queryset = Quiz.objects.all()
    serializer_class = QuizStudentViewSerializer
    permission_classes = [permissions.IsAuthenticated, HasActiveSubscription]


class SubmitQuizView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        quiz = get_object_or_404(Quiz, pk=pk)
        serializer = SubmitQuizSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        attempt = QuizAttempt.objects.create(student=request.user, quiz=quiz)
        graded_attempt = grade_quiz_attempt(attempt, serializer.validated_data['answers'])

        return Response(QuizAttemptResultSerializer(graded_attempt).data, status=status.HTTP_201_CREATED)


class MyQuizAttemptsView(generics.ListAPIView):
    serializer_class = QuizAttemptResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return QuizAttempt.objects.filter(student=self.request.user).order_by('-submitted_at')