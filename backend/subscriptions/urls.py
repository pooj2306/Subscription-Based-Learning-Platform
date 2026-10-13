from django.urls import path
from .views import (
    PlanListView, MySubscriptionsView, SubscribeView, VerifyPaymentView,
    CancelSubscriptionView, PauseSubscriptionView, ResumeSubscriptionView,
    StartFreeTrialView, ProgressCarryoverView, PurchaseCourseView,
    MyPurchasedCoursesView, StudentVerificationView, SmartUpsellView,
)

urlpatterns = [
    path('plans/', PlanListView.as_view(), name='plan-list'),
    path('my/', MySubscriptionsView.as_view(), name='my-subscriptions'),
    path('subscribe/', SubscribeView.as_view(), name='subscribe'),
    path('<int:pk>/pause/', PauseSubscriptionView.as_view(), name='pause-subscription'),
    path('<int:pk>/resume/', ResumeSubscriptionView.as_view(), name='resume-subscription'),
    path('<int:pk>/cancel/', CancelSubscriptionView.as_view(), name='cancel-subscription'),
    path('start-trial/', StartFreeTrialView.as_view(), name='start-free-trial'),
    path('progress-carryover/', ProgressCarryoverView.as_view(), name='progress-carryover'),
    path('purchase-course/', PurchaseCourseView.as_view(), name='purchase-course'),
    path('purchased-courses/', MyPurchasedCoursesView.as_view(), name='my-purchased-courses'),
    path('student-verification/', StudentVerificationView.as_view(), name='student-verification'),
    path('smart-upsell/', SmartUpsellView.as_view(), name='smart-upsell'),
    path('verify-payment/', VerifyPaymentView.as_view(), name='verify-payment'),
]