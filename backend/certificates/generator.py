from reportlab.lib.pagesizes import landscape, A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from django.core.files.base import ContentFile
import io


def generate_certificate_pdf(certificate):
    student_name = certificate.student.get_full_name() or certificate.student.username
    course_title = certificate.course.title
    cert_number = certificate.certificate_number
    issued_date = certificate.issued_at.strftime("%B %d, %Y")

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=landscape(A4))
    width, height = landscape(A4)

    # Border
    c.setStrokeColorRGB(0.2, 0.2, 0.5)
    c.setLineWidth(4)
    c.rect(0.4 * inch, 0.4 * inch, width - 0.8 * inch, height - 0.8 * inch)

    # Title
    c.setFont("Helvetica-Bold", 32)
    c.drawCentredString(width / 2, height - 1.6 * inch, "Certificate of Completion")

    # Subtitle
    c.setFont("Helvetica", 16)
    c.drawCentredString(width / 2, height - 2.3 * inch, "This is to certify that")

    # Student name
    c.setFont("Helvetica-Bold", 26)
    c.drawCentredString(width / 2, height - 3.1 * inch, student_name)

    # Course info
    c.setFont("Helvetica", 16)
    c.drawCentredString(width / 2, height - 3.8 * inch, "has successfully completed the course")

    c.setFont("Helvetica-Bold", 20)
    c.drawCentredString(width / 2, height - 4.4 * inch, course_title)

    # Footer details
    c.setFont("Helvetica", 12)
    c.drawString(1 * inch, 1 * inch, f"Certificate No: {cert_number}")
    c.drawRightString(width - 1 * inch, 1 * inch, f"Issued on: {issued_date}")

    c.showPage()
    c.save()

    buffer.seek(0)
    filename = f"certificate_{cert_number}.pdf"
    certificate.pdf_file.save(filename, ContentFile(buffer.read()), save=True)
    return certificate