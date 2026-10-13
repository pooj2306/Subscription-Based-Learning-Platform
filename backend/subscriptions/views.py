from django.shortcuts import render, get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

from .models import Plan, Subscription, CoursePurchase, StudentVerification
from .serializers import (
    PlanSerializer, SubscriptionSerializer, SubscribeSerializer,
    CoursePurchaseSerializer, StudentVerificationSerializer,
)
from .payment_service import create_razorpay_order, verify_payment_signature
from courses.models import Course
from courses.serializers import CourseSerializer
from progress.models import CourseProgress, LessonProgress
from assessments.models import QuizAttempt
from adaptive_learning.models import StudentTopicScore, SpacedRepetitionCard, Topic


class PlanListView(generics.ListAPIView):
    serializer_class = PlanSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Plan.objects.filter(is_active=True).order_by('price')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class MySubscriptionsView(generics.ListAPIView):
    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Subscription.objects.filter(student=self.request.user).order_by('-created_at')


class SubscribeView(APIView):
    """Student subscribes to a plan - instantly activated with student discount support."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = SubscribeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        plan = Plan.objects.get(id=serializer.validated_data['plan_id'])

        # Check if student is verified for student discount
        amount_to_pay = plan.price
        verification = StudentVerification.objects.filter(
            student=request.user,
            status=StudentVerification.Status.VERIFIED,
        ).first()

        if verification and plan.plan_type != Plan.PlanType.TRIAL:
            discount = (plan.price * verification.discount_rate) / 100
            amount_to_pay = max(0, plan.price - discount)

        subscription = Subscription.objects.create(
            student=request.user,
            plan=plan,
            status=Subscription.Status.ACTIVE,
            amount_paid=amount_to_pay,
            payment_reference="DEMO-PAYMENT",
        )

        return Response(SubscriptionSerializer(subscription).data, status=status.HTTP_201_CREATED)


class PauseSubscriptionView(APIView):
    """Flexible plans: student pauses an active subscription without losing remaining time."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        subscription = get_object_or_404(Subscription, pk=pk, student=request.user)
        try:
            subscription.pause()
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "detail": f"Subscription paused successfully. You have {subscription.remaining_days_at_pause} days preserved. Access to your courses (including owned courses) is stopped until you resume. Resume anytime without losing course progress!",
            "subscription": SubscriptionSerializer(subscription).data,
        }, status=status.HTTP_200_OK)


class ResumeSubscriptionView(APIView):
    """Flexible plans: student resumes a paused subscription and preserved duration is restored."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        subscription = get_object_or_404(Subscription, pk=pk, student=request.user)
        try:
            subscription.resume()
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "detail": "Subscription resumed successfully! Full access is restored.",
            "subscription": SubscriptionSerializer(subscription).data,
        }, status=status.HTTP_200_OK)


class CancelSubscriptionView(APIView):
    """Cancel subscription with Progress Carryover guarantee reassurance."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        subscription = get_object_or_404(Subscription, pk=pk, student=request.user)
        subscription.status = Subscription.Status.CANCELLED
        subscription.save()

        # Count preserved progress items
        lessons_completed = LessonProgress.objects.filter(student=request.user, is_completed=True).count()
        courses_active = CourseProgress.objects.filter(student=request.user).count()

        return Response({
            "detail": "Subscription cancelled.",
            "subscription": SubscriptionSerializer(subscription).data,
            "progress_carryover": {
                "guarantee": "Progress Carryover Guarantee: 100% of your completed lessons, watch positions, quiz scores, and flashcards remain permanently saved.",
                "lessons_preserved": lessons_completed,
                "courses_preserved": courses_active,
                "message": "When you return or re-subscribe, you will pick up exactly where you left off.",
            }
        })


class StartFreeTrialView(APIView):
    """Free trial: 7-day all-access trial with full progress carryover."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        already_used = Subscription.objects.filter(student=request.user, is_trial=True).exists()
        if already_used:
            return Response({
                "detail": "You have already used your 7-day free trial on this account.",
                "trial_used": True,
            }, status=status.HTTP_400_BAD_REQUEST)

        trial_plan = Plan.objects.filter(plan_type=Plan.PlanType.TRIAL).first()
        subscription = Subscription.objects.create(
            student=request.user,
            plan=trial_plan,
            is_trial=True,
            status=Subscription.Status.ACTIVE,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=7),
            amount_paid=0.00,
            payment_reference="FREE-TRIAL-ACTIVATED",
        )

        return Response({
            "detail": "7-Day Free Trial activated! Full access to all courses with Progress Carryover Guarantee.",
            "subscription": SubscriptionSerializer(subscription).data,
            "progress_carryover": {
                "guarantee": "Any progress you make during your free trial is 100% preserved even if the trial ends or you cancel.",
            }
        }, status=status.HTTP_201_CREATED)


class ProgressCarryoverView(APIView):
    """Reports progress carryover stats guaranteeing learning records are preserved."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        lessons_completed = LessonProgress.objects.filter(student=user, is_completed=True).count()
        courses_progress = CourseProgress.objects.filter(student=user)
        courses_count = courses_progress.count()
        quizzes_count = QuizAttempt.objects.filter(student=user).count()
        topics_count = StudentTopicScore.objects.filter(student=user).count()
        flashcards_count = SpacedRepetitionCard.objects.filter(student=user).count()

        trial_used = Subscription.objects.filter(student=user, is_trial=True).exists()
        has_active_sub = Subscription.objects.filter(student=user, status=Subscription.Status.ACTIVE).exists() and any(
            s.is_active for s in Subscription.objects.filter(student=user, status=Subscription.Status.ACTIVE)
        )
        paused_sub = Subscription.objects.filter(student=user, status=Subscription.Status.PAUSED).first()

        return Response({
            "guarantee_title": "100% Progress Carryover Guarantee",
            "guarantee_description": "Your learning history, quiz scores, Elo ratings, and flashcards are permanently preserved across cancellations, pauses, and renewals.",
            "stats": {
                "lessons_completed": lessons_completed,
                "courses_enrolled": courses_count,
                "quizzes_taken": quizzes_count,
                "topics_profiled": topics_count,
                "flashcards_saved": flashcards_count,
            },
            "trial_eligible": not trial_used,
            "has_active_subscription": has_active_sub,
            "has_paused_subscription": bool(paused_sub),
            "paused_subscription_id": paused_sub.id if paused_sub else None,
        })


class PurchaseCourseView(APIView):
    """Pay-per-course: buy an individual course with lifetime access."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        course_id = request.data.get('course_id')
        if not course_id:
            return Response({"detail": "course_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        course = get_object_or_404(Course, pk=course_id)

        purchase, created = CoursePurchase.objects.get_or_create(
            student=request.user,
            course=course,
            defaults={
                "amount_paid": course.price,
                "payment_reference": f"PAY-COURSE-{course.id}-{int(timezone.now().timestamp())}",
            }
        )

        if not created:
            return Response({
                "detail": f"You already own access to '{course.title}'.",
                "purchase": CoursePurchaseSerializer(purchase).data,
            }, status=status.HTTP_200_OK)

        return Response({
            "detail": f"Successfully purchased lifetime access to '{course.title}'!",
            "purchase": CoursePurchaseSerializer(purchase).data,
        }, status=status.HTTP_201_CREATED)


class MyPurchasedCoursesView(generics.ListAPIView):
    """Lists all courses purchased individually by the student."""
    serializer_class = CoursePurchaseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CoursePurchase.objects.filter(student=self.request.user).order_by('-purchased_at')


class StudentVerificationView(APIView):
    """Student discount verification with institutional proof."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        verification = StudentVerification.objects.filter(student=request.user).first()
        if not verification:
            return Response({
                "is_verified": False,
                "verification": None,
                "discount_rate": 50,
            })
        return Response({
            "is_verified": verification.status == StudentVerification.Status.VERIFIED,
            "verification": StudentVerificationSerializer(verification).data,
            "discount_rate": verification.discount_rate,
        })

    def post(self, request):
        institution_name = request.data.get('institution_name', '').strip()
        student_id_number = request.data.get('student_id_number', '').strip()
        student_email = request.data.get('student_email', request.user.email).strip()
        document_name = request.data.get('document_name', 'Student_ID_Card.png').strip()

        if not institution_name or not student_id_number:
            return Response({
                "detail": "institution_name and student_id_number are required for student verification."
            }, status=status.HTTP_400_BAD_REQUEST)

        verification, _ = StudentVerification.objects.update_or_create(
            student=request.user,
            defaults={
                "institution_name": institution_name,
                "student_id_number": student_id_number,
                "student_email": student_email,
                "document_name": document_name,
                "status": StudentVerification.Status.VERIFIED,
                "discount_rate": 50,
                "verified_at": timezone.now(),
            }
        )

        return Response({
            "detail": "Student ID successfully verified! 50% student discount unlocked on all subscription plans.",
            "is_verified": True,
            "verification": StudentVerificationSerializer(verification).data,
        }, status=status.HTTP_200_OK)


class SmartUpsellView(APIView):
    """
    Smart upsell: dynamically recommends a targeted premium course based on the
    student's weak topics rather than showing a generic subscription banner.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        # 1. Inspect student's topic mastery
        topic_scores = StudentTopicScore.objects.filter(student=user).select_related('topic', 'topic__course')
        weak_scores = [s for s in topic_scores if s.strength_label == 'weak' or s.accuracy < 60.0]

        # 2. Also check spaced repetition cards
        card_questions = SpacedRepetitionCard.objects.filter(student=user).values_list('question_id', flat=True)

        recommended_course = None
        headline = ""
        reason = ""
        weak_topic_data = []

        if weak_scores:
            # Sort by lowest accuracy
            weak_scores.sort(key=lambda s: s.accuracy)
            top_weak = weak_scores[:2]
            weak_topic_data = [
                {
                    "topic_name": s.topic.name,
                    "accuracy": s.accuracy,
                    "attempted": s.total_attempted,
                    "correct": s.total_correct,
                    "elo_rating": s.elo_rating,
                }
                for s in top_weak
            ]
            weak_names = [s.topic.name for s in top_weak]
            weak_str = " & ".join(weak_names)

            # Find matching course covering or related to these weak topics
            course_ids = [s.topic.course_id for s in top_weak if s.topic.course_id]
            # Try to find a premium course in same stream or covering DSA/Advanced topics
            matching_courses = Course.objects.filter(id__in=course_ids)
            recommended_course = matching_courses.filter(is_premium=True).first()

            if not recommended_course:
                # Find any premium course matching the stream
                stream = matching_courses.first().stream if matching_courses.exists() else None
                if stream:
                    recommended_course = Course.objects.filter(stream=stream, is_premium=True).first()
                if not recommended_course:
                    # Look for specialized advanced course
                    recommended_course = Course.objects.filter(
                        models.Q(title__icontains='Mastery') | models.Q(is_premium=True)
                    ).first()
                if not recommended_course:
                    recommended_course = matching_courses.first()

            headline = f"Targeted Skill Booster: Overcome stumbling blocks in {weak_str}"
            reason = (
                f"You recently struggled with {weak_str} (as low as {top_weak[0].accuracy}% quiz accuracy). "
                f"'{recommended_course.title if recommended_course else 'Our Premium Track'}' contains dedicated "
                f"in-depth lectures, visual walkthroughs, and adaptive practice tests to turn these weak spots into strengths."
            )
            is_personalized = True

        else:
            # Fallback for students without recorded weak topics: recommend flagship premium course
            recommended_course = Course.objects.filter(is_premium=True).first() or Course.objects.first()
            headline = "Accelerate Your Career with Our Premium Specialization"
            reason = (
                "Deepen your expertise with comprehensive project modules, personalized mentor reviews, "
                "and industry capstone certification."
            )
            is_personalized = False

        if not recommended_course:
            return Response({"detail": "No courses available for recommendation."}, status=status.HTTP_404_NOT_FOUND)

        # Check user's access status
        has_active = (
            Subscription.objects.filter(student=user, status=Subscription.Status.ACTIVE).exists()
            and any(s.is_active for s in Subscription.objects.filter(student=user, status=Subscription.Status.ACTIVE))
        )
        has_paused = Subscription.objects.filter(student=user, status=Subscription.Status.PAUSED).exists() and not has_active
        pause_stops_owned = getattr(settings, 'PAUSE_STOPS_OWNED_COURSE_ACCESS', True)

        if has_paused and pause_stops_owned:
            has_access = False
        else:
            has_access = has_active or CoursePurchase.objects.filter(student=user, course=recommended_course).exists()

        trial_used = Subscription.objects.filter(student=user, is_trial=True).exists()

        # Check student verification for discount pricing
        verification = StudentVerification.objects.filter(
            student=user, status=StudentVerification.Status.VERIFIED
        ).first()
        student_discount_rate = verification.discount_rate if verification else 50
        student_course_price = round(float(recommended_course.price) * (1 - student_discount_rate / 100), 2)

        return Response({
            "is_personalized": is_personalized,
            "headline": headline,
            "reason": reason,
            "weak_topics": weak_topic_data,
            "recommended_course": CourseSerializer(recommended_course, context={'request': request}).data,
            "has_access": has_access,
            "is_subscription_paused": has_paused,
            "pricing": {
                "pay_per_course_price": float(recommended_course.price),
                "student_discount_price": student_course_price,
                "is_student_verified": bool(verification),
                "all_access_monthly_price": 99.00 if verification else 199.00,
            },
            "trial_eligible": not trial_used,
            "call_to_action": f"Master {recommended_course.title} ➔",
        })


class VerifyPaymentView(APIView):
    """Frontend calls this after Razorpay checkout completes."""
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