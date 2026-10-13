"""
Management command to seed realistic capstone mini-projects for all courses.
"""
from django.core.management.base import BaseCommand
from courses.models import Course
from certificates.models import CourseMiniProject


class Command(BaseCommand):
    help = 'Seeds realistic mini-projects for courses.'

    def handle(self, *args, **options):
        self.stdout.write("Seeding capstone mini-projects...")

        projects = {
            'Data Structures': {
                'title': 'Build an LRU Cache & High-Performance Benchmark Suite',
                'description': 'Implement an O(1) Least Recently Used (LRU) Cache utilizing a Doubly Linked List and Hash Table. Benchmark throughput and cache eviction latency against Python collections.',
                'instructions': '1. Fork or create a GitHub repo.\n2. Implement `get(key)` and `put(key, value)` with O(1) guaranteed time complexity.\n3. Write comprehensive unit tests covering edge cases and eviction limits.\n4. Include benchmarking results in your README.',
                'starter_code_url': 'https://github.com/example/lru-cache-starter',
                'estimated_hours': 5,
            },
            'Full-Stack Web': {
                'title': 'Deploy a Production REST API with JWT Auth & Indexing',
                'description': 'Architect and deploy an enterprise-grade REST API backend with token authentication, model relationships, and relational query optimization.',
                'instructions': '1. Build endpoints with DRF.\n2. Implement JWT token authentication and role-based permissions.\n3. Write automated test cases with pytest/Django TestCase.\n4. Provide public GitHub link and optional live API demo URL.',
                'starter_code_url': 'https://github.com/example/django-rest-starter',
                'estimated_hours': 8,
            },
            'Python Programming': {
                'title': 'Automated Data Pipeline & CLI Log Parser Tool',
                'description': 'Develop a Python command-line utility that streams server log files, extracts IP traffic metrics, and writes summary reports.',
                'instructions': '1. Use argparse or click for the CLI interface.\n2. Handle exception boundaries cleanly.\n3. Output statistical insights in JSON and tabular format.',
                'starter_code_url': 'https://github.com/example/python-cli-starter',
                'estimated_hours': 4,
            },
            'React': {
                'title': 'Real-Time Interactive Kanban Board with Drag & Drop',
                'description': 'Create an animated, responsive task management application with optimistic UI updates and local persistence.',
                'instructions': '1. Build modular components using modern React hooks.\n2. Implement drag-and-drop or card reordering.\n3. Deploy live on Vercel/Netlify and link in submission.',
                'starter_code_url': 'https://github.com/example/react-kanban-starter',
                'estimated_hours': 6,
            },
            'Machine Learning': {
                'title': 'Customer Churn Prediction Model & Feature Analysis',
                'description': 'Train classification models on churn datasets, compute ROC-AUC curves, and perform feature importance attribution.',
                'instructions': '1. Clean and normalize dataset.\n2. Train Random Forest / Gradient Boosting models.\n3. Evaluate precision, recall, and F1-score with confusion matrix plots.',
                'starter_code_url': 'https://github.com/example/ml-churn-starter',
                'estimated_hours': 6,
            },
        }

        count = 0
        for course in Course.objects.all():
            matched_key = next((k for k in projects if k.lower() in course.title.lower()), None)
            if matched_key:
                info = projects[matched_key]
            else:
                info = {
                    'title': f'{course.title} Applied Capstone Project',
                    'description': f'Build, test, and document a real-world application showcasing key principles learned in {course.title}.',
                    'instructions': 'Include a public GitHub repository with clean commit history, README documentation, and architecture explanation.',
                    'starter_code_url': 'https://github.com/example/capstone-starter',
                    'estimated_hours': 5,
                }

            CourseMiniProject.objects.update_or_create(
                course=course,
                defaults=info,
            )
            count += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {count} capstone mini-projects across courses!'))
