"""
Management command to seed engagement badges, roadmaps/skill trees,
and vibrant study groups for demonstration.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from courses.models import Course
from engagement.models import (
    Badge,
    EarnedBadge,
    GamificationProfile,
    StudyGroup,
    StudyGroupMembership,
    StudyGroupMessage,
    Roadmap,
    RoadmapNode,
    FocusSession,
)

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds gamification badges, skill tree roadmaps, and active study groups.'

    def handle(self, *args, **options):
        self.stdout.write("Seeding engagement data...")

        # ── 1. Seed Badges ──
        badges_data = [
            {
                'code': 'FIRST_STEP',
                'title': 'First Step',
                'description': 'Completed your first learning activity on SBLP.',
                'icon': '🌱',
                'category': Badge.Category.ACADEMIC,
                'xp_reward': 50,
                'order': 1,
            },
            {
                'code': 'STREAK_3',
                'title': 'Flame Ignition',
                'description': 'Maintained a 3-day continuous daily study streak.',
                'icon': '🔥',
                'category': Badge.Category.STREAK,
                'xp_reward': 150,
                'order': 2,
            },
            {
                'code': 'STREAK_7',
                'title': 'Relentless Warrior',
                'description': 'Maintained a full 7-day learning streak without missing a day.',
                'icon': '⚡',
                'category': Badge.Category.STREAK,
                'xp_reward': 350,
                'order': 3,
            },
            {
                'code': 'STREAK_14',
                'title': 'Two-Week Titan',
                'description': '14 days of unwavering consistency.',
                'icon': '👑',
                'category': Badge.Category.STREAK,
                'xp_reward': 700,
                'order': 4,
            },
            {
                'code': 'FOCUS_50',
                'title': 'Deep Thinker',
                'description': 'Logged 50+ minutes of focused Pomodoro study time.',
                'icon': '⏱️',
                'category': Badge.Category.FOCUS,
                'xp_reward': 150,
                'order': 5,
            },
            {
                'code': 'FOCUS_DEEP_MASTER',
                'title': 'Hyperfocus Master',
                'description': 'Logged over 250 minutes of deep distraction-free learning.',
                'icon': '🧘',
                'category': Badge.Category.FOCUS,
                'xp_reward': 400,
                'order': 6,
            },
            {
                'code': 'XP_500',
                'title': 'XP Rising Star',
                'description': 'Surpassed 500 XP on the global learning leaderboard.',
                'icon': '⭐',
                'category': Badge.Category.ACADEMIC,
                'xp_reward': 100,
                'order': 7,
            },
            {
                'code': 'XP_2000',
                'title': 'Grandmaster Scholar',
                'description': 'Accumulated over 2,000 XP in mastery.',
                'icon': '💎',
                'category': Badge.Category.ACADEMIC,
                'xp_reward': 500,
                'order': 8,
            },
            {
                'code': 'GROUP_JOINED',
                'title': 'Guild Fellow',
                'description': 'Joined a collaborative Study Group with a shared weekly goal.',
                'icon': '🛡️',
                'category': Badge.Category.COMMUNITY,
                'xp_reward': 100,
                'order': 9,
            },
            {
                'code': 'ROADMAP_CONQUEROR',
                'title': 'Roadmap Pioneer',
                'description': 'Unlocked an advanced skill tree stage on a learning roadmap.',
                'icon': '🗺️',
                'category': Badge.Category.ROADMAP,
                'xp_reward': 250,
                'order': 10,
            },
        ]

        for b_dict in badges_data:
            Badge.objects.update_or_create(code=b_dict['code'], defaults=b_dict)

        self.stdout.write(f"Seeded {len(badges_data)} achievement badges.")

        # ── 2. Seed Roadmaps & Skill Trees ──
        # Track 1: Software Engineering & Algorithms
        r1, _ = Roadmap.objects.update_or_create(
            slug='software-engineering-algorithms',
            defaults={
                'title': 'Software Engineering & Core Algorithms',
                'tagline': 'From foundational problem solving to complex algorithms and full-stack systems.',
                'description': 'Master computational problem solving, data structures, relational schemas, and web architectures.',
                'icon': '💻',
                'category': 'Software Engineering',
                'color_gradient': 'from-blue-600 via-indigo-600 to-purple-700',
                'order': 1,
            },
        )

        # Track 2: AI & Machine Learning Pioneer
        r2, _ = Roadmap.objects.update_or_create(
            slug='ai-machine-learning-specialist',
            defaults={
                'title': 'AI & Intelligent Systems Track',
                'tagline': 'Master data wrangling, classical machine learning, and deep neural networks.',
                'description': 'A progressive skill tree from Python foundations to predictive algorithms and deep neural networks.',
                'icon': '🤖',
                'category': 'Artificial Intelligence',
                'color_gradient': 'from-purple-600 via-pink-600 to-rose-600',
                'order': 2,
            },
        )

        # Connect courses to nodes
        c_py = Course.objects.filter(title__icontains='Python Programming').first()
        c_dsa = Course.objects.filter(title__icontains='Data Structures').first()
        c_db = Course.objects.filter(title__icontains='Database Management').first()
        c_web = Course.objects.filter(title__icontains='Full-Stack Web').first()

        c_ds = Course.objects.filter(title__icontains='Data Science with Python').first()
        c_ml = Course.objects.filter(title__icontains='Machine Learning').first()
        c_dl = Course.objects.filter(title__icontains='Deep Learning').first()

        # Nodes for Track 1
        if c_py:
            node_r1_1, _ = RoadmapNode.objects.update_or_create(
                roadmap=r1,
                stage_order=1,
                defaults={
                    'course': c_py,
                    'skill_tag': 'Core Programming & Logic',
                    'short_description': 'Variables, control flows, functions, and algorithmic thinking.',
                    'reward_xp': 200,
                    'icon': '🐍',
                },
            )
        else:
            node_r1_1 = None

        if c_dsa:
            node_r1_2, _ = RoadmapNode.objects.update_or_create(
                roadmap=r1,
                stage_order=2,
                defaults={
                    'course': c_dsa,
                    'skill_tag': 'Data Structures & Algorithms',
                    'short_description': 'Arrays, linked lists, recursion, trees, and time complexity.',
                    'reward_xp': 350,
                    'icon': '⚡',
                },
            )
            if node_r1_1:
                node_r1_2.prerequisites.set([node_r1_1])
        else:
            node_r1_2 = None

        if c_db:
            node_r1_3, _ = RoadmapNode.objects.update_or_create(
                roadmap=r1,
                stage_order=3,
                defaults={
                    'course': c_db,
                    'skill_tag': 'Relational Data & Indexing',
                    'short_description': 'Relational modeling, indexing, ACID transactions, and query optimization.',
                    'reward_xp': 300,
                    'icon': '🗄️',
                },
            )
            if node_r1_2:
                node_r1_3.prerequisites.set([node_r1_2])
        else:
            node_r1_3 = None

        if c_web:
            node_r1_4, _ = RoadmapNode.objects.update_or_create(
                roadmap=r1,
                stage_order=4,
                defaults={
                    'course': c_web,
                    'skill_tag': 'Full-Stack Web Systems',
                    'short_description': 'REST APIs, secure authentication, client-server integration.',
                    'reward_xp': 500,
                    'icon': '🚀',
                },
            )
            if node_r1_3:
                node_r1_4.prerequisites.set([node_r1_3])

        # Nodes for Track 2 (AI)
        if c_py:
            node_r2_1, _ = RoadmapNode.objects.update_or_create(
                roadmap=r2,
                stage_order=1,
                defaults={
                    'course': c_py,
                    'skill_tag': 'Python Data Foundations',
                    'short_description': 'Object-oriented programming, data structures, and script automation.',
                    'reward_xp': 200,
                    'icon': '🐍',
                },
            )
        else:
            node_r2_1 = None

        if c_ds:
            node_r2_2, _ = RoadmapNode.objects.update_or_create(
                roadmap=r2,
                stage_order=2,
                defaults={
                    'course': c_ds,
                    'skill_tag': 'Data Analysis & Visuals',
                    'short_description': 'NumPy, Pandas, exploratory data analysis, and statistical distributions.',
                    'reward_xp': 350,
                    'icon': '📊',
                },
            )
            if node_r2_1:
                node_r2_2.prerequisites.set([node_r2_1])
        else:
            node_r2_2 = None

        if c_ml:
            node_r2_3, _ = RoadmapNode.objects.update_or_create(
                roadmap=r2,
                stage_order=3,
                defaults={
                    'course': c_ml,
                    'skill_tag': 'Classical Machine Learning',
                    'short_description': 'Supervised and unsupervised models, loss functions, and evaluation metrics.',
                    'reward_xp': 450,
                    'icon': '🧠',
                },
            )
            if node_r2_2:
                node_r2_3.prerequisites.set([node_r2_2])
        else:
            node_r2_3 = None

        if c_dl:
            node_r2_4, _ = RoadmapNode.objects.update_or_create(
                roadmap=r2,
                stage_order=4,
                defaults={
                    'course': c_dl,
                    'skill_tag': 'Deep Learning & Neural Networks',
                    'short_description': 'Backpropagation, convolutional nets, recurrent models, and model tuning.',
                    'reward_xp': 600,
                    'icon': '🔮',
                },
            )
            if node_r2_3:
                node_r2_4.prerequisites.set([node_r2_3])

        self.stdout.write("Seeded learning roadmaps and visual skill tree nodes.")

        # ── 3. Seed Study Groups ──
        admin_user = User.objects.filter(role__in=['ADMIN', 'INSTRUCTOR']).first() or User.objects.first()
        student_user = User.objects.filter(username='demo_student').first()

        g1, _ = StudyGroup.objects.update_or_create(
            name='DSA Night Owls Guild',
            defaults={
                'description': 'Daily problem solvers tackling LeetCode patterns, tree traversals, and dynamic programming together.',
                'icon': '🦉',
                'color_theme': 'indigo',
                'created_by': admin_user,
                'weekly_goal_title': 'Conquer 3,000 collective XP & 600 Focus Minutes this week',
                'target_weekly_xp': 3000,
                'target_weekly_focus_minutes': 600,
            },
        )

        g2, _ = StudyGroup.objects.update_or_create(
            name='Full-Stack Architecture Squad',
            defaults={
                'description': 'Building scalable web applications, REST services, database indexing, and interactive UI.',
                'icon': '⚡',
                'color_theme': 'emerald',
                'created_by': admin_user,
                'weekly_goal_title': 'Collaboratively hit 2,500 collective XP & 450 Focus Minutes',
                'target_weekly_xp': 2500,
                'target_weekly_focus_minutes': 450,
            },
        )

        g3, _ = StudyGroup.objects.update_or_create(
            name='AI & Deep Learning Circle',
            defaults={
                'description': 'Exploring neural network architectures, mathematics for ML, and modern AI models.',
                'icon': '🧠',
                'color_theme': 'purple',
                'created_by': admin_user,
                'weekly_goal_title': 'Reach 4,000 collective XP & 800 Deep Focus Minutes',
                'target_weekly_xp': 4000,
                'target_weekly_focus_minutes': 800,
            },
        )

        # Ensure demo_student has initial stats
        if student_user:
            prof, _ = GamificationProfile.objects.get_or_create(
                student=student_user,
                defaults={
                    'xp': 780,
                    'level': 2,
                    'current_streak': 4,
                    'longest_streak': 6,
                    'last_activity_date': timezone.now().date(),
                    'total_focus_minutes': 125,
                },
            )
            # Add to groups
            m1, _ = StudyGroupMembership.objects.get_or_create(
                group=g1,
                student=student_user,
                defaults={
                    'role': StudyGroupMembership.Role.MEMBER,
                    'weekly_contributed_xp': 320,
                    'weekly_contributed_minutes': 75,
                },
            )
            m2, _ = StudyGroupMembership.objects.get_or_create(
                group=g2,
                student=student_user,
                defaults={
                    'role': StudyGroupMembership.Role.MEMBER,
                    'weekly_contributed_xp': 210,
                    'weekly_contributed_minutes': 50,
                },
            )

            # Award initial badges
            b_first = Badge.objects.filter(code='FIRST_STEP').first()
            b_streak = Badge.objects.filter(code='STREAK_3').first()
            b_focus = Badge.objects.filter(code='FOCUS_50').first()
            b_group = Badge.objects.filter(code='GROUP_JOINED').first()
            for b in [b_first, b_streak, b_focus, b_group]:
                if b:
                    EarnedBadge.objects.get_or_create(student=student_user, badge=b)

            # Seed sample cheers
            StudyGroupMessage.objects.get_or_create(
                group=g1,
                author=student_user,
                content='Cracked the two-pointer problem session! Let’s keep the streak going team! 🔥',
            )

        # Seed other students for realistic leaderboard
        other_students = User.objects.filter(role='STUDENT').exclude(username='demo_student')[:5]
        sample_xps = [1420, 1150, 890, 640, 420]
        sample_streaks = [7, 5, 3, 2, 1]
        for idx, stu in enumerate(other_students):
            stu_prof, _ = GamificationProfile.objects.get_or_create(
                student=stu,
                defaults={
                    'xp': sample_xps[idx % len(sample_xps)],
                    'level': max(1, sample_xps[idx % len(sample_xps)] // 500 + 1),
                    'current_streak': sample_streaks[idx % len(sample_streaks)],
                    'longest_streak': sample_streaks[idx % len(sample_streaks)] + 2,
                    'last_activity_date': timezone.now().date(),
                    'total_focus_minutes': 150 + idx * 40,
                },
            )
            # Add to group g1
            StudyGroupMembership.objects.get_or_create(
                group=g1,
                student=stu,
                defaults={
                    'weekly_contributed_xp': 400 - idx * 50,
                    'weekly_contributed_minutes': 90 - idx * 10,
                },
            )

        self.stdout.write(self.style.SUCCESS('Successfully seeded all engagement, roadmap, and study group data!'))
