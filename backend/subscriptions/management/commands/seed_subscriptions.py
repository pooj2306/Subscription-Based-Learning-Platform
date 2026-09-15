from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from subscriptions.models import Plan, Subscription

User = get_user_model()


class Command(BaseCommand):
    help = "Seed dummy subscription plans and a demo student subscription"

    def handle(self, *args, **kwargs):
        # 1. Create dummy plans
        plans_data = [
            {"name": "Basic Monthly", "description": "Access to all beginner courses.", "price": 199, "duration_days": 30},
            {"name": "Pro Quarterly", "description": "Access to all courses for 3 months.", "price": 499, "duration_days": 90},
            {"name": "Premium Yearly", "description": "Full access to all courses for a year.", "price": 1499, "duration_days": 365},
        ]

        plans = {}
        for data in plans_data:
            plan, created = Plan.objects.get_or_create(name=data["name"], defaults=data)
            plans[data["name"]] = plan
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created plan: {plan.name}"))
            else:
                self.stdout.write(f"Plan already exists: {plan.name}")

        # 2. Create a dummy student if none exists
        student, created = User.objects.get_or_create(
            username="demo_student",
            defaults={
                "email": "student@example.com",
                "role": "STUDENT",
                "mobile_number": "9111111111",
            },
        )
        if created:
            student.set_password("Student@123")
            student.save()
            self.stdout.write(self.style.SUCCESS("Created demo_student (password: Student@123)"))

        # 3. Give the demo student an active subscription
        subscription, created = Subscription.objects.get_or_create(
            student=student,
            plan=plans["Basic Monthly"],
            defaults={
                "status": "ACTIVE",
                "amount_paid": plans["Basic Monthly"].price,
                "payment_reference": "DUMMY-TXN-001",
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"Created subscription for {student.username}"))
        else:
            self.stdout.write(f"Subscription already exists for {student.username}")

        self.stdout.write(self.style.SUCCESS("Dummy subscription data seeding complete."))