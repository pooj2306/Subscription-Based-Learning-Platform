"""
Management command to seed realistic topics, questions across Easy/Medium/Hard difficulties,
and sample topic mastery and spaced repetition cards for demoing.

Run:
    python manage.py seed_adaptive_data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from courses.models import Course, Lesson
from assessments.models import Quiz, Question, Choice
from adaptive_learning.models import (
    Topic, AdaptiveQuestion, StudentDifficultyLevel,
    StudentTopicScore, SpacedRepetitionCard,
)

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds sample topics, questions with difficulty levels, and demo student data.'

    def handle(self, *args, **options):
        self.stdout.write("Seeding adaptive learning data...")

        # 1. Ensure instructor and course exist
        instructor = User.objects.filter(role__in=['INSTRUCTOR', 'ADMIN']).first()
        if not instructor:
            instructor = User.objects.create_user(
                username='instructor1',
                email='instructor@sblp.com',
                password='password123',
                role='INSTRUCTOR',
            )

        course = Course.objects.filter(title__icontains='Data Structures').first() or Course.objects.first()
        if not course:
            course = Course.objects.create(
                title='Data Structures and Algorithms in Python',
                description='Master essential DSA concepts from arrays and recursion to dynamic programming.',
                instructor=instructor,
                level='INTERMEDIATE',
                stream='COMPUTER_SCIENCE',
                is_published=True,
            )

        # 2. Create or get Quiz
        quiz, _ = Quiz.objects.get_or_create(
            course=course,
            title='DSA Adaptive Mastery Quiz',
            defaults={
                'description': 'Tests your DSA knowledge with difficulty adapting to your answers in real time.',
                'pass_percentage': 60.0,
                'created_by': instructor,
                'is_active': True,
            },
        )

        # 3. Create Topics
        topic_names = [
            'Arrays & Strings',
            'Recursion & Backtracking',
            'Dynamic Programming',
            'Trees & Graphs',
            'Sorting & Searching',
        ]
        topics = {}
        for name in topic_names:
            t, _ = Topic.objects.get_or_create(name=name, course=course)
            topics[name] = t

        # 4. Questions with Difficulty (1=Easy, 2=Medium, 3=Hard)
        questions_data = [
            # ─── Arrays & Strings ───
            {
                'text': 'What is the time complexity of accessing an element in an array by its index?',
                'marks': 1,
                'topic': topics['Arrays & Strings'],
                'difficulty': 1,  # Easy
                'choices': [
                    ('O(1)', True),
                    ('O(n)', False),
                    ('O(log n)', False),
                    ('O(n^2)', False),
                ],
            },
            {
                'text': 'Which technique is most efficient for checking if a string is a palindrome in place?',
                'marks': 1,
                'topic': topics['Arrays & Strings'],
                'difficulty': 1,  # Easy
                'choices': [
                    ('Two-pointer approach comparing ends inward', True),
                    ('Reversing the entire string with extra memory', False),
                    ('Sorting the string characters', False),
                    ('Hashing every character', False),
                ],
            },
            {
                'text': 'In the sliding window technique for maximum sum subarray of size k, how does the window update at each step?',
                'marks': 2,
                'topic': topics['Arrays & Strings'],
                'difficulty': 2,  # Medium
                'choices': [
                    ('Subtract the element leaving the window and add the new element entering', True),
                    ('Recalculate the sum of all k elements from scratch', False),
                    ('Multiply all elements inside the window', False),
                    ('Sort the array first before computing the window sum', False),
                ],
            },
            {
                'text': 'Kadane\'s algorithm finds the maximum subarray sum in O(n) time by maintaining:',
                'marks': 3,
                'topic': topics['Arrays & Strings'],
                'difficulty': 3,  # Hard
                'choices': [
                    ('max_ending_here = max(arr[i], max_ending_here + arr[i])', True),
                    ('min_ending_here = min(arr[i], min_ending_here * arr[i])', False),
                    ('A 2D matrix of all prefix sums', False),
                    ('A priority queue of running totals', False),
                ],
            },

            # ─── Recursion & Backtracking ───
            {
                'text': 'What is the essential component of any recursive function to prevent infinite loops?',
                'marks': 1,
                'topic': topics['Recursion & Backtracking'],
                'difficulty': 1,  # Easy
                'choices': [
                    ('Base case condition', True),
                    ('Global static counter', False),
                    ('Break statement inside a while loop', False),
                    ('Catch block for RecursionError', False),
                ],
            },
            {
                'text': 'What happens on the call stack if a recursive function does not reach its base case?',
                'marks': 1,
                'topic': topics['Recursion & Backtracking'],
                'difficulty': 1,  # Easy
                'choices': [
                    ('Stack Overflow error occurs', True),
                    ('The function automatically terminates and returns 0', False),
                    ('Memory is cleared automatically', False),
                    ('Execution switches to heap memory', False),
                ],
            },
            {
                'text': 'What is the time complexity of the naive recursive Fibonacci algorithm F(n) = F(n-1) + F(n-2)?',
                'marks': 2,
                'topic': topics['Recursion & Backtracking'],
                'difficulty': 2,  # Medium
                'choices': [
                    ('O(2^n)', True),
                    ('O(n)', False),
                    ('O(n log n)', False),
                    ('O(n^2)', False),
                ],
            },
            {
                'text': 'In backtracking algorithms like N-Queens, what is the purpose of the "undo" or unmarking step?',
                'marks': 3,
                'topic': topics['Recursion & Backtracking'],
                'difficulty': 3,  # Hard
                'choices': [
                    ('Restore state before exploring alternative decision branches', True),
                    ('Free memory occupied by local integers', False),
                    ('Restart the solver from root level 0', False),
                    ('Skip invalid solutions permanently', False),
                ],
            },

            # ─── Dynamic Programming ───
            {
                'text': 'Which two key properties must a problem have to be solved using Dynamic Programming?',
                'marks': 1,
                'topic': topics['Dynamic Programming'],
                'difficulty': 1,  # Easy
                'choices': [
                    ('Overlapping subproblems and optimal substructure', True),
                    ('Greedy choice property and sorting ability', False),
                    ('Linear time complexity and divide-and-conquer structure', False),
                    ('Constant memory and deterministic transitions', False),
                ],
            },
            {
                'text': 'What is the primary difference between Memoization (Top-down) and Tabulation (Bottom-up)?',
                'marks': 2,
                'topic': topics['Dynamic Programming'],
                'difficulty': 2,  # Medium
                'choices': [
                    ('Memoization uses recursion + cache; Tabulation fills an iterative table iteratively', True),
                    ('Memoization uses arrays; Tabulation only uses hash tables', False),
                    ('Tabulation uses recursion; Memoization avoids all recursive calls', False),
                    ('Memoization is always O(1) space; Tabulation requires O(n^2)', False),
                ],
            },
            {
                'text': 'In the 0/1 Knapsack problem with capacity W and items (wt[i], val[i]), what is the DP state transition?',
                'marks': 3,
                'topic': topics['Dynamic Programming'],
                'difficulty': 3,  # Hard
                'choices': [
                    ('dp[i][w] = max(dp[i-1][w], val[i-1] + dp[i-1][w - wt[i-1]])', True),
                    ('dp[i][w] = min(dp[i-1][w], val[i-1] * dp[i-1][w + wt[i-1]])', False),
                    ('dp[i][w] = dp[i-1][w] + dp[i][w-1]', False),
                    ('dp[i][w] = val[i] / wt[i]', False),
                ],
            },

            # ─── Trees & Graphs ───
            {
                'text': 'In a Binary Search Tree (BST), which traversal produces elements in non-decreasing sorted order?',
                'marks': 1,
                'topic': topics['Trees & Graphs'],
                'difficulty': 1,  # Easy
                'choices': [
                    ('In-order traversal (Left, Root, Right)', True),
                    ('Pre-order traversal (Root, Left, Right)', False),
                    ('Post-order traversal (Left, Right, Root)', False),
                    ('Level-order traversal', False),
                ],
            },
            {
                'text': 'Which data structure is typically used to implement Breadth-First Search (BFS) in a graph?',
                'marks': 2,
                'topic': topics['Trees & Graphs'],
                'difficulty': 2,  # Medium
                'choices': [
                    ('Queue (FIFO)', True),
                    ('Stack (LIFO)', False),
                    ('Max-Heap', False),
                    ('Disjoint Set Union', False),
                ],
            },
            {
                'text': 'In Dijkstra\'s shortest path algorithm with a min-heap, what is the overall time complexity for graph G(V, E)?',
                'marks': 3,
                'topic': topics['Trees & Graphs'],
                'difficulty': 3,  # Hard
                'choices': [
                    ('O((V + E) log V)', True),
                    ('O(V * E)', False),
                    ('O(V^3)', False),
                    ('O(E^2)', False),
                ],
            },

            # ─── Sorting & Searching ───
            {
                'text': 'What prerequisite is required to perform Binary Search on an array?',
                'marks': 1,
                'topic': topics['Sorting & Searching'],
                'difficulty': 1,  # Easy
                'choices': [
                    ('The array must be sorted', True),
                    ('The array must contain only positive numbers', False),
                    ('The array size must be an exact power of 2', False),
                    ('Elements must all be unique', False),
                ],
            },
            {
                'text': 'What is the average time complexity of QuickSort?',
                'marks': 2,
                'topic': topics['Sorting & Searching'],
                'difficulty': 2,  # Medium
                'choices': [
                    ('O(n log n)', True),
                    ('O(n^2)', False),
                    ('O(n)', False),
                    ('O(log n)', False),
                ],
            },
        ]

        q_count = 0
        for data in questions_data:
            q, created = Question.objects.get_or_create(
                quiz=quiz,
                text=data['text'],
                defaults={'marks': data['marks'], 'order': q_count + 1},
            )
            AdaptiveQuestion.objects.update_or_create(
                question=q,
                defaults={
                    'difficulty': data['difficulty'],
                    'topic': data['topic'],
                },
            )
            # Create choices
            for choice_text, is_correct in data['choices']:
                Choice.objects.get_or_create(
                    question=q,
                    text=choice_text,
                    defaults={'is_correct': is_correct},
                )
            q_count += 1

        self.stdout.write(self.style.SUCCESS(f"Seeded {q_count} questions across 5 topics & 3 difficulty levels."))

        # 5. Seed sample student topic scores (so "Strong in Arrays, Weak in Recursion" shows immediately!)
        students = User.objects.filter(role='STUDENT')
        if not students.exists():
            student = User.objects.create_user(
                username='student1',
                email='student@sblp.com',
                password='password123',
                role='STUDENT',
            )
            students = [student]

        for s in students:
            # Arrays: 9/10 (90% - Strong, Elo 1380 Master)
            StudentTopicScore.objects.update_or_create(
                student=s, topic=topics['Arrays & Strings'],
                defaults={'total_attempted': 10, 'total_correct': 9, 'elo_rating': 1380},
            )
            # Sorting: 4/5 (80% - Strong, Elo 1280 Proficient)
            StudentTopicScore.objects.update_or_create(
                student=s, topic=topics['Sorting & Searching'],
                defaults={'total_attempted': 5, 'total_correct': 4, 'elo_rating': 1280},
            )
            # Trees: 3/5 (60% - Average, Elo 1190 Intermediate)
            StudentTopicScore.objects.update_or_create(
                student=s, topic=topics['Trees & Graphs'],
                defaults={'total_attempted': 5, 'total_correct': 3, 'elo_rating': 1190},
            )
            # Recursion: 2/7 (28.6% - Weak, Elo 1040 Novice)
            StudentTopicScore.objects.update_or_create(
                student=s, topic=topics['Recursion & Backtracking'],
                defaults={'total_attempted': 7, 'total_correct': 2, 'elo_rating': 1040},
            )
            # Dynamic Programming: 1/5 (20% - Weak, Elo 980 Novice)
            StudentTopicScore.objects.update_or_create(
                student=s, topic=topics['Dynamic Programming'],
                defaults={'total_attempted': 5, 'total_correct': 1, 'elo_rating': 980},
            )

            # Difficulty level tracker
            StudentDifficultyLevel.objects.update_or_create(
                student=s, quiz=quiz,
                defaults={'current_level': 1, 'consecutive_correct': 2, 'consecutive_wrong': 0},
            )

            # Spaced repetition cards for demo
            recursion_q = Question.objects.filter(adaptive_meta__topic=topics['Recursion & Backtracking']).first()
            dp_q = Question.objects.filter(adaptive_meta__topic=topics['Dynamic Programming']).first()
            tree_q = Question.objects.filter(adaptive_meta__topic=topics['Trees & Graphs']).first()

            if recursion_q:
                # Due today (1-day review)
                SpacedRepetitionCard.objects.update_or_create(
                    student=s, question=recursion_q,
                    defaults={
                        'interval_index': 0,
                        'next_review_date': timezone.now().date(),
                        'is_retired': False,
                    },
                )
            if dp_q:
                # Due in 3 days (3-day review)
                SpacedRepetitionCard.objects.update_or_create(
                    student=s, question=dp_q,
                    defaults={
                        'interval_index': 1,
                        'next_review_date': timezone.now().date() + timedelta(days=3),
                        'is_retired': False,
                    },
                )
            if tree_q:
                # Mastered (retired)
                SpacedRepetitionCard.objects.update_or_create(
                    student=s, question=tree_q,
                    defaults={
                        'interval_index': 4,
                        'next_review_date': timezone.now().date() + timedelta(days=30),
                        'is_retired': True,
                    },
                )

        self.stdout.write(self.style.SUCCESS("Successfully seeded demo topic scores and spaced repetition cards!"))
