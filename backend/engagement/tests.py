from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from courses.models import Course, Lesson
from progress.models import CourseProgress, LessonProgress
from .models import (
    GamificationProfile,
    Badge,
    EarnedBadge,
    StudyGroup,
    StudyGroupMembership,
    Roadmap,
    RoadmapNode,
    FocusSession,
)

User = get_user_model()


class EngagementModelAndApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            username='test_student',
            email='student@test.com',
            password='password123',
            role='STUDENT',
        )
        self.instructor = User.objects.create_user(
            username='test_instructor',
            email='instructor@test.com',
            password='password123',
            role='INSTRUCTOR',
        )
        self.course1 = Course.objects.create(
            title='Intro Python',
            instructor=self.instructor,
            is_published=True,
        )
        self.course2 = Course.objects.create(
            title='Data Structures in Python',
            instructor=self.instructor,
            is_published=True,
        )

        # Create Badges
        self.b1 = Badge.objects.create(code='STREAK_3', title='Streak 3', description='3 days', xp_reward=100)
        self.b2 = Badge.objects.create(code='GROUP_JOINED', title='Guild Fellow', description='Joined group', xp_reward=100)

        # Roadmap setup
        self.roadmap = Roadmap.objects.create(title='Python Mastery', slug='python-mastery')
        self.node1 = RoadmapNode.objects.create(roadmap=self.roadmap, course=self.course1, stage_order=1)
        self.node2 = RoadmapNode.objects.create(roadmap=self.roadmap, course=self.course2, stage_order=2)
        self.node2.prerequisites.set([self.node1])

        # Study Group
        self.group = StudyGroup.objects.create(
            name='Test Guild',
            created_by=self.instructor,
            target_weekly_xp=1000,
            target_weekly_focus_minutes=200,
        )

    def test_gamification_profile_xp_and_level(self):
        prof, _ = GamificationProfile.objects.get_or_create(student=self.student)
        self.assertEqual(prof.level, 1)

        result = prof.award_xp(600, reason="Completed module")
        self.assertEqual(prof.xp, 600)
        self.assertEqual(prof.level, 2)
        self.assertTrue(result['leveled_up'])

    def test_roadmap_unlock_prerequisite_logic(self):
        # Node 1 has no prereqs, so should be unlocked
        self.assertTrue(self.node1.is_unlocked_for_student(self.student))
        # Node 2 has Node 1 as prereq, and student hasn't completed course1 yet
        self.assertFalse(self.node2.is_unlocked_for_student(self.student))

        # Complete course1
        CourseProgress.objects.create(
            student=self.student,
            course=self.course1,
            is_course_completed=True,
            progress_percent=100.0,
        )
        # Node 2 should now unlock!
        self.assertTrue(self.node2.is_unlocked_for_student(self.student))

    def test_record_focus_session_awards_xp_and_contributes_to_group(self):
        self.client.force_authenticate(user=self.student)
        # Join study group first
        self.client.post(f'/api/engagement/groups/{self.group.id}/join/')

        res = self.client.post('/api/engagement/focus/record/', {
            'duration_minutes': 25,
            'mode': 'POMODORO_25',
            'course_id': self.course1.id,
            'notes': 'Focused deep session on Python variables',
        }, format='json')

        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data['duration_minutes'], 25)
        self.assertEqual(res.data['xp_earned'], 50)

        # Check membership contribution
        mem = StudyGroupMembership.objects.get(group=self.group, student=self.student)
        self.assertEqual(mem.weekly_contributed_xp, 50)
        self.assertEqual(mem.weekly_contributed_minutes, 25)

    def test_leaderboard_endpoint(self):
        self.client.force_authenticate(user=self.student)
        prof, _ = GamificationProfile.objects.get_or_create(student=self.student)
        prof.award_xp(1200)

        res = self.client.get('/api/engagement/leaderboard/')
        self.assertEqual(res.status_code, 200)
        self.assertTrue(len(res.data['top_learners']) > 0)
        self.assertEqual(res.data['top_learners'][0]['username'], 'test_student')
