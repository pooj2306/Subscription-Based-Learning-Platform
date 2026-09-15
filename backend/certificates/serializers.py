from rest_framework import serializers
from .models import Certificate


class CertificateSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = Certificate
        fields = ['id', 'certificate_number', 'student', 'student_name', 'course', 'course_title', 'pdf_file', 'issued_at']
        read_only_fields = ['certificate_number', 'pdf_file', 'issued_at']