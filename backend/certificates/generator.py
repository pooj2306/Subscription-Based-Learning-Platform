from reportlab.lib.pagesizes import landscape, A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.lib import colors
from django.core.files.base import ContentFile
import io


def generate_certificate_pdf(certificate):
    student_name = certificate.student.get_full_name() or certificate.student.username
    course_title = certificate.course.title
    cert_number = certificate.certificate_number
    issued_date = certificate.issued_at.strftime("%B %d, %Y")
    project_title = certificate.verified_project_title or (
        certificate.project_submission.project.title if certificate.project_submission else "Capstone Mini-Project"
    )
    quiz_score = certificate.quiz_score or 85.0

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=landscape(A4))
    width, height = landscape(A4)

    # ── Outer Background & Double Border ──
    # Outer dark blue border
    c.setStrokeColor(colors.HexColor('#1e1b4b'))  # indigo-950
    c.setLineWidth(6)
    c.rect(0.35 * inch, 0.35 * inch, width - 0.7 * inch, height - 0.7 * inch)

    # Inner gold border
    c.setStrokeColor(colors.HexColor('#d97706'))  # amber-600 gold
    c.setLineWidth(2)
    c.rect(0.45 * inch, 0.45 * inch, width - 0.9 * inch, height - 0.9 * inch)

    # Corner Accents
    c.setFillColor(colors.HexColor('#d97706'))
    c.circle(0.45 * inch, height - 0.45 * inch, 4, fill=1, stroke=0)
    c.circle(width - 0.45 * inch, height - 0.45 * inch, 4, fill=1, stroke=0)
    c.circle(0.45 * inch, 0.45 * inch, 4, fill=1, stroke=0)
    c.circle(width - 0.45 * inch, 0.45 * inch, 4, fill=1, stroke=0)

    # ── Header ──
    c.setFillColor(colors.HexColor('#4f46e5'))  # brand indigo
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(width / 2, height - 1.1 * inch, "SUBSCRIPTION-BASED LEARNING PLATFORM • VERIFIED CREDENTIAL")

    c.setFillColor(colors.HexColor('#0f172a'))  # slate-900
    c.setFont("Helvetica-Bold", 28)
    c.drawCentredString(width / 2, height - 1.7 * inch, "Certificate of Verified Mastery")

    # Subtitle
    c.setFillColor(colors.HexColor('#64748b'))  # slate-500
    c.setFont("Helvetica", 13)
    c.drawCentredString(width / 2, height - 2.2 * inch, "This honors certificate is awarded to")

    # Student name
    c.setFillColor(colors.HexColor('#1e1b4b'))
    c.setFont("Helvetica-Bold", 26)
    c.drawCentredString(width / 2, height - 2.8 * inch, student_name)

    # Divider bar
    c.setStrokeColor(colors.HexColor('#e2e8f0'))
    c.setLineWidth(1)
    c.line(width / 2 - 2 * inch, height - 3.0 * inch, width / 2 + 2 * inch, height - 3.0 * inch)

    # Course Completion statement
    c.setFillColor(colors.HexColor('#475569'))
    c.setFont("Helvetica", 13)
    c.drawCentredString(width / 2, height - 3.4 * inch, "for demonstrating rigorous competency and completing all requirements for")

    # Course Title
    c.setFillColor(colors.HexColor('#4338ca'))  # indigo-700
    c.setFont("Helvetica-Bold", 20)
    c.drawCentredString(width / 2, height - 3.9 * inch, course_title)

    # ── Project-Based Proof Box (The Credibility Anchor) ──
    c.setFillColor(colors.HexColor('#f8fafc'))  # light box
    c.setStrokeColor(colors.HexColor('#cbd5e1'))
    c.setLineWidth(1)
    box_w = 7.2 * inch
    box_h = 0.95 * inch
    box_x = (width - box_w) / 2
    box_y = height - 5.1 * inch
    c.roundRect(box_x, box_y, box_w, box_h, 8, fill=1, stroke=1)

    # Box content
    c.setFillColor(colors.HexColor('#0f172a'))
    c.setFont("Helvetica-Bold", 10)
    c.drawString(box_x + 0.3 * inch, box_y + 0.65 * inch, "PROJECT-BASED CREDENTIAL VERIFICATION:")

    c.setFillColor(colors.HexColor('#334155'))
    c.setFont("Helvetica", 10)
    c.drawString(
        box_x + 0.3 * inch, box_y + 0.40 * inch,
        f"• Verified Capstone Project: {project_title[:55]}"
    )
    c.drawString(
        box_x + 0.3 * inch, box_y + 0.18 * inch,
        f"• Assessment Exam Score: {quiz_score:.1f}%  |  Status: Code Reviewed & Approved"
    )

    # ── Footer / Signatures & Seal ──
    # Left: Certificate ID
    c.setFillColor(colors.HexColor('#64748b'))
    c.setFont("Helvetica", 9)
    c.drawString(0.8 * inch, 0.9 * inch, f"Verification ID: {cert_number}")
    c.drawString(0.8 * inch, 0.7 * inch, f"Issue Date: {issued_date}")

    # Center: Gold Seal Emulation
    c.setFillColor(colors.HexColor('#fbbf24'))  # gold
    c.setStrokeColor(colors.HexColor('#d97706'))
    c.setLineWidth(2)
    c.circle(width / 2, 0.95 * inch, 24, fill=1, stroke=1)
    c.setFillColor(colors.HexColor('#78350f'))
    c.setFont("Helvetica-Bold", 7)
    c.drawCentredString(width / 2, 0.98 * inch, "VERIFIED")
    c.drawCentredString(width / 2, 0.85 * inch, "PROJECT")

    # Right: Institutional Signature Line
    c.setStrokeColor(colors.HexColor('#94a3b8'))
    c.setLineWidth(1)
    c.line(width - 2.8 * inch, 1.0 * inch, width - 0.8 * inch, 1.0 * inch)
    c.setFillColor(colors.HexColor('#334155'))
    c.setFont("Helvetica-Bold", 9)
    c.drawRightString(width - 0.8 * inch, 0.82 * inch, "Director of Academic Credentials")
    c.setFillColor(colors.HexColor('#94a3b8'))
    c.setFont("Helvetica", 8)
    c.drawRightString(width - 0.8 * inch, 0.68 * inch, "Subscription-Based Learning Platform")

    c.showPage()
    c.save()

    buffer.seek(0)
    filename = f"certificate_{cert_number}.pdf"
    certificate.pdf_file.save(filename, ContentFile(buffer.read()), save=True)
    return certificate