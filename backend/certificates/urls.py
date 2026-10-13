from django.urls import path
from .views import (
    MyCertificatesView,
    RequestCertificateView,
    CourseCertificationStatusView,
    CourseMiniProjectDetailView,
    SubmitProjectView,
)

urlpatterns = [
    path('', MyCertificatesView.as_view(), name='my-certificates'),
    path('my/', MyCertificatesView.as_view(), name='my-certificates-legacy'),
    path('course/<int:course_id>/request/', RequestCertificateView.as_view(), name='request-certificate'),
    path('request/<int:course_id>/', RequestCertificateView.as_view(), name='request-certificate-legacy'),
    path('course/<int:course_id>/status/', CourseCertificationStatusView.as_view(), name='course-cert-status'),
    path('course/<int:course_id>/project/', CourseMiniProjectDetailView.as_view(), name='course-mini-project'),
    path('course/<int:course_id>/project/submit/', SubmitProjectView.as_view(), name='submit-mini-project'),
]