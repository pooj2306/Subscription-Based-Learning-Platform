import razorpay
from django.conf import settings

client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


def create_razorpay_order(amount_rupees, receipt_id):
    """Creates a Razorpay order. amount_rupees is converted to paise (Razorpay uses smallest currency unit)."""
    order = client.order.create({
        "amount": int(amount_rupees * 100),  # paise
        "currency": "INR",
        "receipt": receipt_id,
        "payment_capture": 1,
    })
    return order


def verify_payment_signature(order_id, payment_id, signature):
    """Returns True if the payment signature is genuine, False otherwise."""
    try:
        client.utility.verify_payment_signature({
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": signature,
        })
        return True
    except razorpay.errors.SignatureVerificationError:
        return False