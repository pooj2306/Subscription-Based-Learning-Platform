from rest_framework import serializers
from .models import Certificate, CourseMiniProject, ProjectSubmission


class CourseMiniProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseMiniProject
        fields = [
            'id', 'course', 'title', 'description', 'instructions',
            'starter_code_url', 'estimated_hours', 'created_at',
        ]


class ProjectSubmissionSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source='student.username', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)

    class Meta:
        model = ProjectSubmission
        fields = [
            'id', 'project', 'project_title', 'student', 'student_username',
            'github_repo_url', 'live_demo_url', 'description',
            'attachment_file', 'status', 'grade_score',
            'instructor_feedback', 'submitted_at', 'reviewed_at',
        ]
        read_only_fields = ['id', 'student', 'submitted_at']


class CertificateSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)
    course_level = serializers.CharField(source='course.level', read_only=True)
    pdf_url = serializers.FileField(source='pdf_file', read_only=True)

    class Meta:
        model = Certificate
        fields = [
            'id', 'certificate_number', 'student_name', 'course_title', 'course_level',
            'verified_project_title', 'quiz_score', 'pdf_url', 'issued_at',
        ]