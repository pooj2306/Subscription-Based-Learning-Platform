from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.contrib.auth import get_user_model
from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone
from datetime import timedelta
import random

from courses.models import Course, Lesson
from subscriptions.models import Subscription, Plan
from progress.models import CourseProgress, LessonProgress
from assessments.models import Quiz, Question, Choice, QuizAttempt, StudentAnswer
from adaptive_learning.models import Topic, AdaptiveQuestion, StudentTopicScore, SpacedRepetitionCard
from engagement.models import FocusSession, GamificationProfile
from certificates.models import ProjectSubmission, Certificate
from .models import SupportTicket
from .permissions import IsAdmin, IsInstructorOrAdmin

User = get_user_model()


class UserStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        data = {
            "total_users": User.objects.count(),
            "total_students": User.objects.filter(role='STUDENT').count(),
            "total_instructors": User.objects.filter(role='INSTRUCTOR').count(),
            "total_admins": User.objects.filter(role='ADMIN').count(),
        }
        return Response(data)


class SubscriptionRevenueStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        total_revenue = Subscription.objects.aggregate(total=Sum('amount_paid'))['total'] or 0
        active_subs = Subscription.objects.filter(status='ACTIVE').count()
        expired_subs = Subscription.objects.filter(status='EXPIRED').count()
        cancelled_subs = Subscription.objects.filter(status='CANCELLED').count()

        by_plan = list(
            Subscription.objects.values('plan__name').annotate(
                count=Count('id'),
                revenue=Sum('amount_paid'),
            )
        )

        data = {
            "total_revenue": total_revenue,
            "active_subscriptions": active_subs,
            "expired_subscriptions": expired_subs,
            "cancelled_subscriptions": cancelled_subs,
            "revenue_by_plan": by_plan,
        }
        return Response(data)


class CourseEngagementStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        courses = Course.objects.annotate(
            total_enrollments=Count('progress_entries', distinct=True),
        )

        data = []
        for course in courses:
            avg_progress = CourseProgress.objects.filter(course=course).aggregate(
                avg=Avg('progress_percent')
            )['avg'] or 0
            completed_count = CourseProgress.objects.filter(course=course, is_course_completed=True).count()

            data.append({
                "course_id": course.id,
                "course_title": course.title,
                "instructor": course.instructor.username,
                "total_enrollments": course.total_enrollments,
                "average_progress_percent": round(avg_progress, 2),
                "completed_count": completed_count,
            })

        return Response(data)


class QuizStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        total_attempts = QuizAttempt.objects.count()
        passed = QuizAttempt.objects.filter(passed=True).count()
        avg_score = QuizAttempt.objects.aggregate(avg=Avg('percentage'))['avg'] or 0

        data = {
            "total_quiz_attempts": total_attempts,
            "passed_attempts": passed,
            "failed_attempts": total_attempts - passed,
            "average_score_percent": round(avg_score, 2),
        }
        return Response(data)


class SystemOverviewView(APIView):
    """Combined snapshot for the main admin dashboard landing page."""
    permission_classes = [IsAdmin]

    def get(self, request):
        data = {
            "total_users": User.objects.count(),
            "total_courses": Course.objects.count(),
            "total_active_subscriptions": Subscription.objects.filter(status='ACTIVE').count(),
            "total_revenue": Subscription.objects.aggregate(total=Sum('amount_paid'))['total'] or 0,
            "total_quiz_attempts": QuizAttempt.objects.count(),
        }
        return Response(data)


# ─────────────────────────────────────────────────────────────────
# 1. Student Dashboard Analytics: Time Spent, Accuracy Trends & Readiness
# ─────────────────────────────────────────────────────────────────

class StudentAnalyticsView(APIView):
    """
    Analytics for the student dashboard:
    - Time spent: Total hours, focus minutes, lecture minutes, 7-day daily breakdown.
    - Accuracy trends: Rolling quiz accuracy over time, per-topic scores, strength trajectories.
    - Predicted exam readiness: Algorithmic index (0-100%), readiness tier, estimated pass probability,
      weak-topic focus points, and actionable next steps.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        student = request.user
        if request.user.role in ['ADMIN', 'INSTRUCTOR'] and request.query_params.get('student_id'):
            found = User.objects.filter(id=request.query_params.get('student_id')).first()
            if found:
                student = found

        today = timezone.now().date()

        # ── 1. TIME SPENT ANALYSIS ──
        focus_sessions = FocusSession.objects.filter(student=student)
        total_focus_minutes = focus_sessions.aggregate(total=Sum('duration_minutes'))['total'] or 0

        lesson_progress_qs = LessonProgress.objects.filter(student=student)
        total_watch_seconds = lesson_progress_qs.aggregate(total=Sum('last_watched_position_seconds'))['total'] or 0
        total_watch_minutes = total_watch_seconds // 60

        total_study_minutes = total_focus_minutes + total_watch_minutes
        total_study_hours = round(total_study_minutes / 60, 1)

        daily_breakdown = []
        for i in range(6, -1, -1):
            target_date = today - timedelta(days=i)
            day_focus = focus_sessions.filter(completed_at__date=target_date).aggregate(
                total=Sum('duration_minutes')
            )['total'] or 0

            day_lessons = lesson_progress_qs.filter(updated_at__date=target_date)
            day_watch = sum((lp.last_watched_position_seconds // 60) for lp in day_lessons)

            day_total = day_focus + day_watch
            daily_breakdown.append({
                "date": target_date.strftime("%Y-%m-%d"),
                "day_name": target_date.strftime("%a"),
                "focus_minutes": day_focus,
                "lecture_minutes": day_watch,
                "total_minutes": day_total,
                "total_hours": round(day_total / 60, 2),
            })

        gamification = GamificationProfile.objects.filter(student=student).first()
        streak_days = gamification.current_streak if gamification else 0
        current_xp = gamification.xp if gamification else 0
        current_level = gamification.level if gamification else 1

        # ── 2. ACCURACY TRENDS ──
        attempts = QuizAttempt.objects.filter(student=student).order_by('submitted_at').select_related('quiz', 'quiz__course')
        attempt_history = []
        for att in attempts:
            attempt_history.append({
                "id": att.id,
                "quiz_title": att.quiz.title,
                "course_title": att.quiz.course.title if att.quiz.course else "General",
                "score": att.score,
                "total_marks": att.total_marks,
                "percentage": round(att.percentage, 1),
                "passed": att.passed,
                "date": att.submitted_at.strftime("%b %d"),
                "timestamp": att.submitted_at.isoformat(),
            })

        total_attempts = len(attempt_history)
        passed_attempts = sum(1 for a in attempt_history if a['passed'])
        overall_accuracy = round(sum(a['percentage'] for a in attempt_history) / total_attempts, 1) if total_attempts > 0 else 0.0

        recent_5 = attempt_history[-5:] if total_attempts >= 5 else attempt_history
        recent_accuracy = round(sum(a['percentage'] for a in recent_5) / len(recent_5), 1) if recent_5 else 0.0

        if total_attempts < 2:
            trend_direction = "STABLE"
            trend_label = "Baseline Started"
        elif recent_accuracy >= overall_accuracy + 3:
            trend_direction = "UPWARD"
            trend_label = f"+{round(recent_accuracy - overall_accuracy, 1)}% Upward Momentum"
        elif recent_accuracy <= overall_accuracy - 3:
            trend_direction = "DOWNWARD"
            trend_label = f"-{round(overall_accuracy - recent_accuracy, 1)}% Needs Revision"
        else:
            trend_direction = "STEADY"
            trend_label = "Consistent Performance"

        topic_scores = StudentTopicScore.objects.filter(student=student).select_related('topic')
        topic_breakdown = []
        for ts in topic_scores:
            topic_breakdown.append({
                "topic_id": ts.topic.id,
                "topic_name": ts.topic.name,
                "accuracy": ts.accuracy,
                "total_attempted": ts.total_attempted,
                "total_correct": ts.total_correct,
                "elo_rating": ts.elo_rating,
                "elo_tier": ts.elo_tier,
                "strength_label": ts.strength_label,
            })

        strong_topics = [t for t in topic_breakdown if t['strength_label'] == 'strong']
        weak_topics = [t for t in topic_breakdown if t['strength_label'] == 'weak']

        # ── 3. PREDICTED EXAM READINESS ──
        enrolled_progress = CourseProgress.objects.filter(student=student)
        if enrolled_progress.exists():
            avg_lesson_completion = sum(cp.progress_percent for cp in enrolled_progress) / enrolled_progress.count()
        else:
            total_system_lessons = Lesson.objects.count()
            completed_system_lessons = lesson_progress_qs.filter(is_completed=True).count()
            avg_lesson_completion = (completed_system_lessons / total_system_lessons * 100) if total_system_lessons > 0 else 0.0
        lesson_completion_pct = min(100.0, round(avg_lesson_completion, 1))

        quiz_accuracy_pct = overall_accuracy

        sr_cards = SpacedRepetitionCard.objects.filter(student=student)
        total_sr_cards = sr_cards.count()
        if total_sr_cards > 0:
            mastered_count = sr_cards.filter(is_retired=True).count()
            advanced_count = sr_cards.filter(interval_index__gte=2, is_retired=False).count()
            sr_retention_pct = min(100.0, round(((mastered_count + advanced_count * 0.75) / total_sr_cards) * 100, 1))
        else:
            sr_retention_pct = quiz_accuracy_pct if total_attempts > 0 else 60.0

        has_approved_project = ProjectSubmission.objects.filter(student=student, status='APPROVED').exists()
        has_submitted_project = ProjectSubmission.objects.filter(student=student).exists()
        project_completion_pct = 100.0 if has_approved_project else (50.0 if has_submitted_project else 0.0)

        readiness_score = round(
            0.35 * lesson_completion_pct +
            0.35 * quiz_accuracy_pct +
            0.15 * sr_retention_pct +
            0.15 * project_completion_pct,
            1
        )

        if readiness_score >= 85:
            readiness_tier = "EXAM_READY"
            tier_display = "Exam Ready (High Distinction)"
            tier_badge_color = "emerald"
            pass_probability = min(99, round(85 + (readiness_score - 85) * 0.9, 1))
            advice = "Outstanding readiness. You possess comprehensive syllabus coverage and proven question recall. You are well positioned to pass with flying colors."
        elif readiness_score >= 70:
            readiness_tier = "PASSING_READY"
            tier_display = "Solid Foundation (Passing Readiness)"
            tier_badge_color = "blue"
            pass_probability = round(70 + (readiness_score - 70) * 1.0, 1)
            advice = "Good conceptual understanding across core units. Prioritize targeted practice in identified weak topics to elevate to top honors."
        elif readiness_score >= 50:
            readiness_tier = "MODERATE"
            tier_display = "Moderate (Needs Targeted Revision)"
            tier_badge_color = "amber"
            pass_probability = round(45 + (readiness_score - 50) * 1.2, 1)
            advice = "Moderate preparation. Complete pending module lessons, submit your capstone project, and clear your flashcard backlog to raise readiness."
        else:
            readiness_tier = "EARLY_STAGE"
            tier_display = "Early Stage (Not Exam Ready Yet)"
            tier_badge_color = "rose"
            pass_probability = max(12, round(readiness_score * 0.9, 1))
            advice = "Foundational stage. We recommend engaging in daily focus sessions and progressing through the foundational video lectures."

        due_cards_count = sr_cards.filter(is_retired=False, next_review_date__lte=today).count()
        completed_lessons_count = lesson_progress_qs.filter(is_completed=True).count()

        return Response({
            "time_spent": {
                "total_study_minutes": total_study_minutes,
                "total_study_hours": total_study_hours,
                "total_focus_minutes": total_focus_minutes,
                "total_watch_minutes": total_watch_minutes,
                "daily_breakdown": daily_breakdown,
                "streak_days": streak_days,
                "xp": current_xp,
                "level": current_level,
                "completed_lessons_count": completed_lessons_count,
            },
            "accuracy_trends": {
                "overall_accuracy": overall_accuracy,
                "recent_accuracy": recent_accuracy,
                "total_attempts": total_attempts,
                "passed_attempts": passed_attempts,
                "trend_direction": trend_direction,
                "trend_label": trend_label,
                "attempt_history": attempt_history,
                "topic_breakdown": topic_breakdown,
                "strong_topics": strong_topics,
                "weak_topics": weak_topics,
            },
            "exam_readiness": {
                "readiness_score": readiness_score,
                "readiness_tier": readiness_tier,
                "tier_display": tier_display,
                "tier_badge_color": tier_badge_color,
                "pass_probability": pass_probability,
                "advice": advice,
                "components": {
                    "lesson_completion_pct": lesson_completion_pct,
                    "quiz_accuracy_pct": quiz_accuracy_pct,
                    "sr_retention_pct": sr_retention_pct,
                    "project_completion_pct": project_completion_pct,
                },
                "action_items": {
                    "weak_topics_to_revise": [t['topic_name'] for t in weak_topics],
                    "due_flashcards": due_cards_count,
                    "has_approved_project": has_approved_project,
                }
            }
        })


# ─────────────────────────────────────────────────────────────────
# 2. Instructor Dashboard Analytics: Drop-off & Most Often Missed Questions
# ─────────────────────────────────────────────────────────────────

class InstructorAnalyticsView(APIView):
    """
    Instructor Analytics Dashboard:
    - Which lessons students drop off at: Per-lesson started, completed, drop-off rate %,
      average watch position, bottleneck friction flags.
    - Which questions are most often missed: Top missed questions, failure rate %,
      total attempts, and the most commonly chosen wrong choice (misconception trap analysis).
    """
    permission_classes = [IsInstructorOrAdmin]

    def get(self, request):
        instructor = request.user
        courses = Course.objects.all() if instructor.role == 'ADMIN' else Course.objects.filter(instructor=instructor)

        course_id = request.query_params.get('course_id')
        selected_course = None
        if course_id:
            try:
                selected_course = courses.filter(id=course_id).first()
                if selected_course:
                    courses = courses.filter(id=course_id)
            except (ValueError, TypeError):
                pass

        all_my_courses = Course.objects.all() if instructor.role == 'ADMIN' else Course.objects.filter(instructor=instructor)
        courses_list = list(all_my_courses.values('id', 'title', 'level', 'stream'))

        # ── 1. LESSON DROP-OFF ANALYSIS ──
        all_lessons_dropoff = []
        bottlenecks = []

        total_enrolled_students = CourseProgress.objects.filter(course__in=courses).values('student').distinct().count()

        for course in courses:
            lessons = course.lessons.all().order_by('order')

            for lesson in lessons:
                started_count = LessonProgress.objects.filter(lesson=lesson).count()
                completed_count = LessonProgress.objects.filter(lesson=lesson, is_completed=True).count()
                drop_off_count = max(0, started_count - completed_count)
                drop_off_rate = round((drop_off_count / started_count * 100), 1) if started_count > 0 else 0.0
                completion_rate = round((completed_count / started_count * 100), 1) if started_count > 0 else 0.0

                avg_watch_seconds = LessonProgress.objects.filter(lesson=lesson).aggregate(
                    avg=Avg('last_watched_position_seconds')
                )['avg'] or 0

                is_bottleneck = (drop_off_rate >= 30.0 and started_count >= 1)
                severity = "HIGH" if drop_off_rate >= 40.0 else ("MEDIUM" if drop_off_rate >= 25.0 else "LOW")

                item = {
                    "course_id": course.id,
                    "course_title": course.title,
                    "lesson_id": lesson.id,
                    "order": lesson.order,
                    "title": lesson.title,
                    "module_name": lesson.module_name or f"Lesson {lesson.order}",
                    "duration_minutes": lesson.duration_minutes,
                    "started_count": started_count,
                    "completed_count": completed_count,
                    "drop_off_count": drop_off_count,
                    "drop_off_rate": drop_off_rate,
                    "completion_rate": completion_rate,
                    "avg_watch_seconds": round(avg_watch_seconds, 0),
                    "is_bottleneck": is_bottleneck,
                    "bottleneck_severity": severity,
                }
                all_lessons_dropoff.append(item)
                if is_bottleneck:
                    bottlenecks.append(item)

        worst_dropoff_lesson = max(all_lessons_dropoff, key=lambda x: x['drop_off_rate']) if all_lessons_dropoff else None

        # ── 2. MOST OFTEN MISSED QUESTIONS ──
        quizzes = Quiz.objects.filter(course__in=courses)
        questions = Question.objects.filter(quiz__in=quizzes).select_related('quiz', 'quiz__course')

        missed_questions = []
        for q in questions:
            answers = StudentAnswer.objects.filter(question=q).select_related('selected_choice')
            total_answers = answers.count()
            if total_answers == 0:
                continue

            incorrect_answers = answers.filter(is_correct=False)
            incorrect_count = incorrect_answers.count()
            correct_count = total_answers - incorrect_count
            failure_rate = round((incorrect_count / total_answers * 100), 1)

            common_wrong_choice = None
            trap_count = 0
            trap_pct = 0.0

            if incorrect_count > 0:
                top_wrong = incorrect_answers.values('selected_choice__text').annotate(
                    cnt=Count('id')
                ).order_by('-cnt').first()

                if top_wrong:
                    common_wrong_choice = top_wrong['selected_choice__text']
                    trap_count = top_wrong['cnt']
                    trap_pct = round((trap_count / incorrect_count * 100), 1)

            topic_name = "General"
            difficulty_label = "Medium"
            if hasattr(q, 'adaptive_meta'):
                if q.adaptive_meta.topic:
                    topic_name = q.adaptive_meta.topic.name
                difficulty_label = q.adaptive_meta.get_difficulty_display()

            correct_choice = q.choices.filter(is_correct=True).first()
            correct_choice_text = correct_choice.text if correct_choice else ""

            missed_questions.append({
                "question_id": q.id,
                "question_text": q.text,
                "quiz_id": q.quiz.id,
                "quiz_title": q.quiz.title,
                "course_id": q.quiz.course.id,
                "course_title": q.quiz.course.title,
                "topic": topic_name,
                "difficulty": difficulty_label,
                "total_attempts": total_answers,
                "correct_count": correct_count,
                "incorrect_count": incorrect_count,
                "failure_rate": failure_rate,
                "correct_choice_text": correct_choice_text,
                "most_common_wrong_choice": common_wrong_choice,
                "trap_count": trap_count,
                "trap_pct": trap_pct,
                "severity": "CRITICAL" if failure_rate >= 50 else ("MODERATE" if failure_rate >= 25 else "LOW"),
            })

        missed_questions.sort(key=lambda x: (x['failure_rate'], x['total_attempts']), reverse=True)

        return Response({
            "courses": courses_list,
            "selected_course_id": selected_course.id if selected_course else None,
            "summary": {
                "total_courses": courses.count(),
                "total_enrolled_students": total_enrolled_students,
                "total_lessons_tracked": len(all_lessons_dropoff),
                "bottleneck_lessons_count": len(bottlenecks),
                "total_questions_evaluated": len(missed_questions),
                "critical_questions_count": sum(1 for q in missed_questions if q['failure_rate'] >= 50),
                "worst_dropoff_lesson": worst_dropoff_lesson,
            },
            "lesson_dropoff": all_lessons_dropoff,
            "bottlenecks": bottlenecks,
            "most_missed_questions": missed_questions,
        })


class IndustryTrendsView(APIView):
    """
    Returns trending industry programs, trending portfolio projects,
    and must-learn modern competitive tools mapped to platform courses.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # Helper to find matching course on platform
        def find_course(keyword):
            c = Course.objects.filter(
                Q(title__icontains=keyword) | Q(stream__icontains=keyword) | Q(description__icontains=keyword)
            ).first()
            if c:
                return {
                    "id": c.id,
                    "title": c.title,
                    "level": c.level,
                    "stream": c.stream,
                    "price": float(c.price),
                    "is_premium": c.is_premium,
                }
            return None

        trending_programs = [
            {
                "id": "prog-genai",
                "title": "Generative AI & LLM Systems Engineer",
                "category": "Artificial Intelligence",
                "demand_score": 98,
                "growth_rate": "+142% YoY Demand",
                "salary_range": "$140,000 - $195,000 / ₹18L - ₹35L",
                "badge": "🔥 Highest Market Demand",
                "summary": "Build production-grade retrieval augmented generation (RAG), agentic workflows with LangGraph, and deploy private open-weight models.",
                "core_competencies": ["RAG Architecture", "Vector Embeddings", "Prompt Engineering", "Fine-Tuning", "Agentic Systems"],
                "essential_tools": ["LangChain", "PyTorch", "pgvector", "Ollama", "FastAPI"],
                "matching_course": find_course("Deep Learning") or find_course("Artificial Intelligence"),
            },
            {
                "id": "prog-fullstack",
                "title": "Full-Stack Cloud & Modern Web Architect",
                "category": "Web Development",
                "demand_score": 95,
                "growth_rate": "+68% YoY Demand",
                "salary_range": "$120,000 - $165,000 / ₹14L - ₹28L",
                "badge": "⚡ High Hiring Volume",
                "summary": "Master end-to-end web product engineering from interactive React frontends to robust Django/FastAPI microservices and serverless backends.",
                "core_competencies": ["Server Components", "API Architecture", "Auth & RBAC", "State Management", "Database Normalization"],
                "essential_tools": ["React.js", "Django", "TypeScript", "PostgreSQL", "Docker"],
                "matching_course": find_course("Full-Stack") or find_course("React"),
            },
            {
                "id": "prog-dsa",
                "title": "Algorithmic Problem Solving & High-Scale Systems",
                "category": "Computer Science",
                "demand_score": 96,
                "growth_rate": "Tier-1 Interview Benchmark",
                "salary_range": "$135,000 - $210,000 / ₹18L - ₹42L",
                "badge": "🏆 FAANG / Tier-1 Must",
                "summary": "Master complex dynamic programming, graph algorithms, asymptotic analysis, and data structure engineering required to crack top-tier technical interviews.",
                "core_competencies": ["Dynamic Programming", "Graph Traversal", "System Scalability", "Bit Manipulation", "Space-Time Tradeoffs"],
                "essential_tools": ["Python", "Algorithms", "Memory Profiling", "Benchmarking", "Git"],
                "matching_course": find_course("Mastery") or find_course("Data Structures"),
            },
            {
                "id": "prog-mlops",
                "title": "MLOps & Autonomous Agent Developer",
                "category": "Machine Learning",
                "demand_score": 93,
                "growth_rate": "+110% YoY Demand",
                "salary_range": "$130,000 - $185,000 / ₹16L - ₹32L",
                "badge": "🤖 Emerging Specialty",
                "summary": "Automate the lifecycle of machine learning pipelines: continuous training, inference optimization, model monitoring, and autonomous task execution.",
                "core_competencies": ["Model Serving", "Inference Latency", "Pipeline Orchestration", "Drift Detection", "Containerization"],
                "essential_tools": ["Docker", "Kubernetes", "MLflow", "GitHub Actions", "Python"],
                "matching_course": find_course("Machine Learning") or find_course("Python"),
            },
            {
                "id": "prog-cloud-data",
                "title": "Cloud Data Platforms & Distributed SQL Engineering",
                "category": "Databases & Cloud",
                "demand_score": 92,
                "growth_rate": "+85% YoY Demand",
                "salary_range": "$125,000 - $175,000 / ₹15L - ₹30L",
                "badge": "🛡️ Enterprise Pillar",
                "summary": "Design scalable relational schemas, optimize complex multi-table joins, implement distributed indexing, and maintain enterprise data integrity.",
                "core_competencies": ["Query Optimization", "Indexing Strategies", "ACID Compliance", "Distributed Sharding", "ETL Pipelines"],
                "essential_tools": ["MySQL", "PostgreSQL", "Apache Kafka", "Redis", "Docker"],
                "matching_course": find_course("Database") or find_course("MySQL"),
            },
        ]

        trending_projects = [
            {
                "id": "proj-multi-agent-rag",
                "title": "Autonomous Multi-Agent RAG Customer Support & Reasoning Hub",
                "domain": "Artificial Intelligence & LLMs",
                "difficulty": "Advanced",
                "estimated_time": "3 - 4 Weeks",
                "stack": ["Python", "LangChain", "FastAPI", "pgvector", "React"],
                "why_it_gets_hired": "Proves you can build production AI apps with hallucination guardrails, hybrid vector search, and asynchronous tool orchestration.",
                "key_highlights": [
                    "Hybrid lexical (BM25) and semantic vector similarity retrieval",
                    "Multi-agent supervisor pattern delegating billing, tech support, and refunds",
                    "Sub-second streaming token response with WebSocket integration",
                ],
                "matching_course": find_course("Deep Learning") or find_course("Machine Learning"),
            },
            {
                "id": "proj-realtime-fintech",
                "title": "Low-Latency Distributed Trading Order Book & Event Streamer",
                "domain": "Distributed Systems & Fintech",
                "difficulty": "Intermediate - Advanced",
                "estimated_time": "2 - 3 Weeks",
                "stack": ["Django", "Apache Kafka", "Redis", "WebSockets", "Docker"],
                "why_it_gets_hired": "Recruiters look for verifiable mastery of concurrency, race-condition mitigation, and distributed idempotency.",
                "key_highlights": [
                    "High-throughput order matching engine with in-memory Redis structures",
                    "Event-driven audit logging with Kafka message consumers",
                    "Live candlestick price chart updates over bi-directional WebSockets",
                ],
                "matching_course": find_course("Full-Stack") or find_course("Database"),
            },
            {
                "id": "proj-microservices-saas",
                "title": "Cloud-Native SaaS Microservices Platform with Kubernetes CI/CD",
                "domain": "Cloud & DevSecOps",
                "difficulty": "Advanced",
                "estimated_time": "3 - 4 Weeks",
                "stack": ["Docker", "Kubernetes", "GitHub Actions", "PostgreSQL", "React"],
                "why_it_gets_hired": "Shows you can take code from local development to scalable zero-downtime production infrastructure.",
                "key_highlights": [
                    "Automated GitHub Actions pipeline building and scanning container images",
                    "Kubernetes Helm charts with Horizontal Pod Autoscaling (HPA) and ingress",
                    "Distributed JWT authentication across independently scaled services",
                ],
                "matching_course": find_course("Git") or find_course("Full-Stack"),
            },
            {
                "id": "proj-ai-code-auditor",
                "title": "Automated AST Security Linter & Vulnerability Remediation Bot",
                "domain": "Developer Tooling & Security",
                "difficulty": "Intermediate",
                "estimated_time": "2 Weeks",
                "stack": ["Python", "Abstract Syntax Trees (AST)", "FastAPI", "GitHub API"],
                "why_it_gets_hired": "Demonstrates deep understanding of software security, AST parsing, and building developer-facing automation.",
                "key_highlights": [
                    "Parses Python source code into syntax trees to identify SQL injection and insecure secrets",
                    "GitHub Webhook bot that automatically posts actionable diff comments on pull requests",
                    "Adaptive rule engine allowing customizable linting policies",
                ],
                "matching_course": find_course("Python") or find_course("Git"),
            },
        ]

        tools_radar = [
            {
                "category": "AI & Agentic Engineering",
                "description": "Essential for training, fine-tuning, and deploying intelligent models and autonomous agents.",
                "tools": [
                    {"name": "PyTorch", "role": "Deep Learning Standard", "demand_score": 97, "badge": "Core ML", "icon": "🔥"},
                    {"name": "LangChain / LangGraph", "role": "Agentic Workflows & RAG", "demand_score": 95, "badge": "Top GenAI", "icon": "🦜"},
                    {"name": "Ollama / vLLM", "role": "High-Throughput Inference", "demand_score": 92, "badge": "Local LLMs", "icon": "🦙"},
                    {"name": "Hugging Face", "role": "Model Hub & Transformers", "demand_score": 94, "badge": "Ecosystem", "icon": "🤗"},
                ],
            },
            {
                "category": "Full-Stack & Backend Systems",
                "description": "The dominant stack powering modern scalable SaaS platforms and API backends.",
                "tools": [
                    {"name": "Next.js 15 & React", "role": "Full-Stack Server Components", "demand_score": 96, "badge": "Standard", "icon": "⚛️"},
                    {"name": "FastAPI", "role": "Async High-Speed Microservices", "demand_score": 93, "badge": "Top Python", "icon": "⚡"},
                    {"name": "Django", "role": "Batteries-Included SaaS Engine", "demand_score": 91, "badge": "Enterprise", "icon": "🛡️"},
                    {"name": "TypeScript", "role": "Type-Safe Production Code", "demand_score": 95, "badge": "Universal", "icon": "🔷"},
                ],
            },
            {
                "category": "Cloud, Containers & Infrastructure",
                "description": "Production requirements for packaging, deploying, and auto-scaling modern workloads.",
                "tools": [
                    {"name": "Docker", "role": "Containerization Standard", "demand_score": 98, "badge": "Mandatory", "icon": "🐳"},
                    {"name": "Kubernetes (K8s)", "role": "Cloud Cluster Orchestration", "demand_score": 92, "badge": "Scale", "icon": "☸️"},
                    {"name": "GitHub Actions", "role": "Automated CI/CD Workflows", "demand_score": 94, "badge": "Automation", "icon": "🐙"},
                    {"name": "Terraform", "role": "Infrastructure as Code (IaC)", "demand_score": 89, "badge": "Cloud", "icon": "🏗️"},
                ],
            },
            {
                "category": "Databases & High-Velocity Data",
                "description": "Managing structured, unstructured, and vector embeddings at scale.",
                "tools": [
                    {"name": "PostgreSQL & pgvector", "role": "Relational + Vector Embeddings", "demand_score": 97, "badge": "King of DBs", "icon": "🐘"},
                    {"name": "Redis", "role": "Sub-Millisecond Caching & Queues", "demand_score": 93, "badge": "In-Memory", "icon": "⚡"},
                    {"name": "Apache Kafka", "role": "Distributed Event Streaming", "demand_score": 90, "badge": "Big Data", "icon": "📨"},
                    {"name": "MySQL", "role": "Reliable High-Volume Transactions", "demand_score": 91, "badge": "Standard", "icon": "🐬"},
                ],
            },
        ]

        market_insights = {
            "headline": "2026 Competitive Tech Landscape",
            "stat_callouts": [
                {"stat": "78%", "label": "Job postings demanding AI/RAG integration skills alongside web dev"},
                {"stat": "84%", "label": "Tier-1 engineering interviews prioritizing DSA & algorithmic reasoning"},
                {"stat": "3.2x", "label": "Higher recruiter interview rate for candidates with Docker/Kubernetes projects"},
            ],
            "advice": "To stand out in today's competitive job market, move beyond tutorial clones: build projects with real vector search, distributed caching, and containerized deployments."
        }

        return Response({
            "market_insights": market_insights,
            "trending_programs": trending_programs,
            "trending_projects": trending_projects,
            "tools_radar": tools_radar,
        })


class SupportTicketView(APIView):
    """Allows students and demo visitors to submit Help Desk support tickets."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        name = request.data.get('name', '').strip()
        email = request.data.get('email', '').strip()
        category = request.data.get('category', 'OTHER').strip()
        subject = request.data.get('subject', '').strip()
        description = request.data.get('description', '').strip()

        if not all([name, email, subject, description]):
            return Response(
                {"detail": "Name, email, subject, and description are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ticket_number = f"TICK-{random.randint(10000, 99999)}"
        while SupportTicket.objects.filter(ticket_number=ticket_number).exists():
            ticket_number = f"TICK-{random.randint(10000, 99999)}"

        ticket = SupportTicket.objects.create(
            ticket_number=ticket_number,
            name=name,
            email=email,
            category=category,
            subject=subject,
            description=description,
        )

        return Response({
            "ticket_number": ticket.ticket_number,
            "message": f"Support request {ticket.ticket_number} received! Our support engineering team will review it and reply to {email} within 24 hours.",
            "status": ticket.status,
            "created_at": ticket.created_at,
        }, status=status.HTTP_201_CREATED)