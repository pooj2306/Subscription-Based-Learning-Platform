from django.shortcuts import render

# Create your views here.
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.conf import settings
from .models import Plan, Subscription
from .serializers import PlanSerializer, SubscriptionSerializer, SubscribeSerializer
from .payment_service import create_razorpay_order, verify_payment_signature


class PlanListView(generics.ListAPIView):
    queryset = Plan.objects.filter(is_active=True)
    serializer_class = PlanSerializer
    permission_classes = [permissions.AllowAny]


class MySubscriptionsView(generics.ListAPIView):
    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Subscription.objects.filter(student=self.request.user).order_by('-created_at')


class SubscribeView(APIView):
    """Student subscribes to a plan - instantly activated for demo purposes."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = SubscribeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        plan = Plan.objects.get(id=serializer.validated_data['plan_id'])

        subscription = Subscription.objects.create(
            student=request.user,
            plan=plan,
            status=Subscription.Status.ACTIVE,
            amount_paid=plan.price,
            payment_reference="DEMO-PAYMENT",
        )

        return Response(SubscriptionSerializer(subscription).data, status=status.HTTP_201_CREATED)


class VerifyPaymentView(APIView):
    """Step 2: Frontend calls this after Razorpay checkout completes, with the payment details."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        order_id = request.data.get('razorpay_order_id')
        payment_id = request.data.get('razorpay_payment_id')
        signature = request.data.get('razorpay_signature')

        if not all([order_id, payment_id, signature]):
            return Response({"detail": "Missing payment verification fields."}, status=status.HTTP_400_BAD_REQUEST)

        is_valid = verify_payment_signature(order_id, payment_id, signature)
        if not is_valid:
            return Response({"detail": "Payment verification failed."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            subscription = Subscription.objects.get(razorpay_order_id=order_id, student=request.user)
        except Subscription.DoesNotExist:
            return Response({"detail": "Subscription not found."}, status=status.HTTP_404_NOT_FOUND)

        subscription.status = Subscription.Status.ACTIVE
        subscription.payment_reference = payment_id
        subscription.save()

        return Response(SubscriptionSerializer(subscription).data, status=status.HTTP_200_OK)


class CancelSubscriptionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            subscription = Subscription.objects.get(pk=pk, student=request.user)
        except Subscription.DoesNotExist:
            return Response({"detail": "Subscription not found."}, status=status.HTTP_404_NOT_FOUND)

        subscription.status = Subscription.Status.CANCELLED
        subscription.save()
        return Response(SubscriptionSerializer(subscription).data)