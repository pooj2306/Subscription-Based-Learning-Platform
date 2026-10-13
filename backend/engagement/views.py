from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model

from .models import (
    GamificationProfile,
    Badge,
    EarnedBadge,
    StudyGroup,
    StudyGroupMembership,
    StudyGroupMessage,
    Roadmap,
    RoadmapNode,
    FocusSession,
    check_and_award_badges,
)
from .serializers import (
    GamificationProfileSerializer,
    BadgeSerializer,
    EarnedBadgeSerializer,
    LeaderboardEntrySerializer,
    StudyGroupSerializer,
    StudyGroupDetailSerializer,
    StudyGroupMessageSerializer,
    RoadmapSerializer,
    RoadmapDetailSerializer,
    FocusSessionSerializer,
    RecordFocusSessionSerializer,
)

User = get_user_model()


# ──────────────────────────────────────────────
# 1. Gamification Profile & Badges
# ──────────────────────────────────────────────

class MyGamificationProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = GamificationProfile.objects.get_or_create(student=request.user)
        # Ensure streak is evaluated
        profile.record_daily_activity()
        check_and_award_badges(request.user)
        serializer = GamificationProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)


class AllBadgesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        badges = Badge.objects.all().order_by('order', 'title')
        earned_ids = set(
            EarnedBadge.objects.filter(student=request.user).values_list('badge_id', flat=True)
        )
        data = []
        for b in badges:
            b_data = BadgeSerializer(b).data
            b_data['is_earned'] = b.id in earned_ids
            earned_record = EarnedBadge.objects.filter(student=request.user, badge=b).first()
            b_data['earned_at'] = earned_record.earned_at.strftime("%Y-%m-%d") if earned_record else None
            data.append(b_data)

        return Response({
            'total_badges': len(badges),
            'earned_count': len(earned_ids),
            'badges': data,
        })


# ──────────────────────────────────────────────
# 2. Leaderboards
# ──────────────────────────────────────────────

class LeaderboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profiles = (
            GamificationProfile.objects.select_related('student')
            .filter(student__role='STUDENT')
            .order_by('-xp', '-current_streak')[:50]
        )

        entries = []
        user_rank = None

        for idx, p in enumerate(profiles, start=1):
            is_me = p.student_id == request.user.id
            if is_me:
                user_rank = idx

            badge_count = EarnedBadge.objects.filter(student=p.student).count()
            entries.append({
                'rank': idx,
                'user_id': p.student.id,
                'username': p.student.username,
                'xp': p.xp,
                'level': p.level,
                'level_title': p.level_title,
                'current_streak': p.current_streak,
                'total_focus_minutes': p.total_focus_minutes,
                'badge_count': badge_count,
                'is_current_user': is_me,
            })

        # If current user is not in top 50, fetch rank
        if user_rank is None:
            my_prof, _ = GamificationProfile.objects.get_or_create(student=request.user)
            higher_count = GamificationProfile.objects.filter(xp__gt=my_prof.xp).count()
            user_rank = higher_count + 1

        return Response({
            'top_learners': entries[:20],
            'user_rank': user_rank,
            'total_participants': GamificationProfile.objects.count(),
        })


# ──────────────────────────────────────────────
# 3. Study Groups with Shared Weekly Goal
# ──────────────────────────────────────────────

class StudyGroupListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        groups = StudyGroup.objects.all().prefetch_related('memberships')
        serializer = StudyGroupSerializer(groups, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        name = request.data.get('name', '').strip()
        description = request.data.get('description', '').strip()
        icon = request.data.get('icon', '🚀')
        color_theme = request.data.get('color_theme', 'indigo')
        target_weekly_xp = int(request.data.get('target_weekly_xp', 2500))
        target_weekly_focus_minutes = int(request.data.get('target_weekly_focus_minutes', 500))
        weekly_goal_title = request.data.get(
            'weekly_goal_title',
            f"Achieve {target_weekly_xp:,} collective XP & {target_weekly_focus_minutes} focus minutes this week",
        )

        if not name:
            return Response({'error': 'Group name is required.'}, status=status.HTTP_400_BAD_REQUEST)

        group = StudyGroup.objects.create(
            name=name,
            description=description,
            icon=icon,
            color_theme=color_theme,
            created_by=request.user,
            weekly_goal_title=weekly_goal_title,
            target_weekly_xp=target_weekly_xp,
            target_weekly_focus_minutes=target_weekly_focus_minutes,
        )

        # Creator automatically becomes leader
        StudyGroupMembership.objects.create(
            group=group,
            student=request.user,
            role=StudyGroupMembership.Role.LEADER,
        )

        check_and_award_badges(request.user)
        serializer = StudyGroupDetailSerializer(group, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class StudyGroupDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        group = get_object_or_404(
            StudyGroup.objects.prefetch_related('memberships__student', 'messages__author'),
            pk=pk,
        )
        serializer = StudyGroupDetailSerializer(group, context={'request': request})
        return Response(serializer.data)


class JoinStudyGroupView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        group = get_object_or_404(StudyGroup, pk=pk)
        membership, created = StudyGroupMembership.objects.get_or_create(
            group=group,
            student=request.user,
            defaults={'role': StudyGroupMembership.Role.MEMBER},
        )
        check_and_award_badges(request.user)

        # Award community participation XP bonus
        prof, _ = GamificationProfile.objects.get_or_create(student=request.user)
        prof.award_xp(50, reason=f"Joined Study Group: {group.name}")

        return Response({
            'message': f"Successfully joined '{group.name}'!",
            'is_member': True,
        })


class LeaveStudyGroupView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        group = get_object_or_404(StudyGroup, pk=pk)
        deleted_count, _ = StudyGroupMembership.objects.filter(
            group=group,
            student=request.user,
        ).delete()

        return Response({
            'message': f"Left '{group.name}'.",
            'is_member': False,
        })


class PostStudyGroupMessageView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        group = get_object_or_404(StudyGroup, pk=pk)
        content = request.data.get('content', '').strip()
        if not content:
            return Response({'error': 'Message content cannot be blank.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check membership
        if not group.memberships.filter(student=request.user).exists():
            return Response({'error': 'Join this group to post cheers and updates.'}, status=status.HTTP_403_FORBIDDEN)

        msg = StudyGroupMessage.objects.create(
            group=group,
            author=request.user,
            content=content,
        )
        serializer = StudyGroupMessageSerializer(msg)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ──────────────────────────────────────────────
# 4. Learning Roadmaps & Visual Skill Trees
# ──────────────────────────────────────────────

class RoadmapListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        roadmaps = Roadmap.objects.filter(is_active=True).prefetch_related('nodes__course')
        serializer = RoadmapSerializer(roadmaps, many=True, context={'request': request})
        return Response(serializer.data)


class RoadmapDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, slug):
        roadmap = get_object_or_404(
            Roadmap.objects.prefetch_related('nodes__course', 'nodes__prerequisites__course'),
            slug=slug,
            is_active=True,
        )
        serializer = RoadmapDetailSerializer(roadmap, context={'request': request})
        return Response(serializer.data)


# ──────────────────────────────────────────────
# 5. Focus Mode: Pomodoro Session Tracker
# ──────────────────────────────────────────────

class RecordFocusSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = RecordFocusSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        duration = data['duration_minutes']
        mode = data['mode']
        notes = data.get('notes', '')
        course_id = data.get('course_id')
        lesson_id = data.get('lesson_id')

        # Calculate XP: 2 XP per focused minute (e.g., 25m = 50 XP, 50m = 100 XP)
        xp_to_award = duration * 2

        session = FocusSession.objects.create(
            student=request.user,
            course_id=course_id,
            lesson_id=lesson_id,
            mode=mode,
            duration_minutes=duration,
            notes=notes,
            xp_earned=xp_to_award,
        )

        # 1. Update Gamification Profile
        prof, _ = GamificationProfile.objects.get_or_create(student=request.user)
        prof.total_focus_minutes += duration
        prof.award_xp(xp_to_award, reason=f"Completed {duration}m Focus Session ({mode})")

        # 2. Contribute to all joined Study Groups
        user_memberships = StudyGroupMembership.objects.filter(student=request.user)
        for mem in user_memberships:
            mem.contribute(xp=xp_to_award, minutes=duration)

        check_and_award_badges(request.user)

        return Response({
            'message': f"Great job! Logged {duration} focused minutes and earned +{xp_to_award} XP.",
            'xp_earned': xp_to_award,
            'duration_minutes': duration,
            'total_focus_minutes': prof.total_focus_minutes,
            'current_streak': prof.current_streak,
            'new_xp': prof.xp,
            'level': prof.level,
        }, status=status.HTTP_201_CREATED)


class RecentFocusSessionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        sessions = FocusSession.objects.filter(student=request.user).order_by('-completed_at')[:10]
        today_minutes = sum(
            s.duration_minutes for s in sessions if s.completed_at.date() == today
        )
        serializer = FocusSessionSerializer(sessions, many=True)
        return Response({
            'today_minutes': today_minutes,
            'sessions': serializer.data,
        })
