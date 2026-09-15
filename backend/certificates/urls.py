from django.urls import path
from .views import RequestCertificateView, MyCertificatesView

urlpatterns = [
    path('request/<int:course_id>/', RequestCertificateView.as_view(), name='request-certificate'),
    path('my/', MyCertificatesView.as_view(), name='my-certificates'),
]