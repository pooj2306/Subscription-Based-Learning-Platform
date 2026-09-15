from .models import StudentAnswer


def grade_quiz_attempt(attempt, answers_data):
    """
    answers_data: list of dicts like [{"question_id": 1, "choice_id": 3}, ...]
    Creates StudentAnswer records, computes score, updates the attempt.
    """
    from .models import Question, Choice

    total_marks = 0
    score = 0

    for question in attempt.quiz.questions.all():
        total_marks += question.marks

        answer_entry = next((a for a in answers_data if a['question_id'] == question.id), None)
        if not answer_entry:
            continue  # unanswered question, no marks awarded

        try:
            selected_choice = Choice.objects.get(id=answer_entry['choice_id'], question=question)
        except Choice.DoesNotExist:
            continue

        is_correct = selected_choice.is_correct
        if is_correct:
            score += question.marks

        StudentAnswer.objects.create(
            attempt=attempt,
            question=question,
            selected_choice=selected_choice,
            is_correct=is_correct,
        )

    percentage = round((score / total_marks) * 100, 2) if total_marks > 0 else 0.0
    passed = percentage >= attempt.quiz.pass_percentage

    attempt.score = score
    attempt.total_marks = total_marks
    attempt.percentage = percentage
    attempt.passed = passed
    attempt.save()

    return attempt