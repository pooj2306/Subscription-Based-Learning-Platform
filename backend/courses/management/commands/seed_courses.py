from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from courses.models import Course, Lesson, Material
from django.core.files.base import ContentFile

User = get_user_model()

SAMPLE_VIDEO_URL = "https://www.w3schools.com/html/mov_bbb.mp4"  # free public sample video


class Command(BaseCommand):
    help = "Seed dummy courses, lessons, and materials for testing/demo"

    def handle(self, *args, **kwargs):
        # 1. Create a dummy instructor if none exists
        instructor, created = User.objects.get_or_create(
            username="demo_instructor",
            defaults={
                "email": "instructor@example.com",
                "role": "INSTRUCTOR",
                "mobile_number": "9000000000",
            },
        )
        if created:
            instructor.set_password("Instructor@123")
            instructor.save()
            self.stdout.write(self.style.SUCCESS("Created demo_instructor (password: Instructor@123)"))

        # 2. Dummy course data
        courses_data = [
            {
                "title": "Python for Beginners",
                "description": "Learn Python programming from scratch.",
                "stream": "Computer Science",
                "level": "BEGINNER",
                "lessons": [
                    ("Introduction to Python", 10),
                    ("Variables and Data Types", 15),
                    ("Loops and Conditionals", 20),
                ],
            },
            {
                "title": "Django Web Development",
                "description": "Build full-stack web apps using Django.",
                "stream": "Computer Science",
                "level": "INTERMEDIATE",
                "lessons": [
                    ("Setting up Django", 12),
                    ("Models and Migrations", 18),
                    ("Building REST APIs", 25),
                ],
            },
            {
                "title": "Digital Marketing Basics",
                "description": "Understand the fundamentals of digital marketing.",
                "stream": "Business",
                "level": "BEGINNER",
                "lessons": [
                    ("Introduction to Digital Marketing", 10),
                    ("SEO Fundamentals", 15),
                ],
            },
        ]

        for course_info in courses_data:
            course, created = Course.objects.get_or_create(
                title=course_info["title"],
                defaults={
                    "description": course_info["description"],
                    "stream": course_info["stream"],
                    "level": course_info["level"],
                    "instructor": instructor,
                    "is_published": True,
                    "requires_subscription": True,
                },
            )

            if not created:
                self.stdout.write(f"Course already exists: {course.title}")
                continue

            for order, (lesson_title, duration) in enumerate(course_info["lessons"], start=1):
                lesson = Lesson.objects.create(
                    course=course,
                    title=lesson_title,
                    order=order,
                    video_url=SAMPLE_VIDEO_URL,
                    duration_minutes=duration,
                )

                # Attach a dummy note (text file) to each lesson
                note_content = f"These are dummy notes for '{lesson_title}' in course '{course.title}'."
                material = Material(lesson=lesson, title=f"{lesson_title} - Notes")
                material.file.save(f"{lesson_title.replace(' ', '_')}_notes.txt", ContentFile(note_content))
                material.save()

            self.stdout.write(self.style.SUCCESS(f"Created course: {course.title} with lessons and notes"))

        self.stdout.write(self.style.SUCCESS("Dummy course data seeding complete."))