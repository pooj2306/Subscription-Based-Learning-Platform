from django.urls import path
from .views import PlanListView, MySubscriptionsView, SubscribeView, VerifyPaymentView, CancelSubscriptionView

urlpatterns = [
    path('plans/', PlanListView.as_view(), name='plan-list'),
    path('my/', MySubscriptionsView.as_view(), name='my-subscriptions'),
    path('subscribe/', SubscribeView.as_view(), name='subscribe'),
    path('verify-payment/', VerifyPaymentView.as_view(), name='verify-payment'),
    path('<int:pk>/cancel/', CancelSubscriptionView.as_view(), name='cancel-subscription'),
]