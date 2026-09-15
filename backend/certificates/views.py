from django.shortcuts import render

# Create your views here.
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from progress.models import CourseProgress
from courses.models import Course
from .models import Certificate
from .serializers import CertificateSerializer
from .generator import generate_certificate_pdf


class RequestCertificateView(APIView):
    """Student requests a certificate - only succeeds if course is fully completed."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, course_id):
        course = get_object_or_404(Course, id=course_id)

        # SRS 4.7: verify course completion before issuing certificates
        try:
            progress = CourseProgress.objects.get(student=request.user, course=course)
        except CourseProgress.DoesNotExist:
            return Response(
                {"detail": "You have not started this course yet."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not progress.is_course_completed:
            return Response(
                {"detail": "Course not yet completed. Certificate cannot be issued."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        certificate, created = Certificate.objects.get_or_create(
            student=request.user,
            course=course,
        )

        if created or not certificate.pdf_file:
            certificate = generate_certificate_pdf(certificate)

        return Response(CertificateSerializer(certificate).data, status=status.HTTP_201_CREATED)


class MyCertificatesView(generics.ListAPIView):
    serializer_class = CertificateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Certificate.objects.filter(student=self.request.user)