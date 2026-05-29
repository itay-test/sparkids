"""Stripe payment verification and webhook handling."""
import os
import stripe
from fastapi import APIRouter, Request, Header, HTTPException
from services.auth_service import verify_token, set_user_premium

router = APIRouter()
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
FREE_LIMIT = 10


@router.get("/verify")
async def verify_payment(session_id: str, authorization: str = Header(default="")):
    """
    Called after Stripe Checkout success redirect.
    Verifies the session was paid, marks user as premium in Firestore.
    """
    if not stripe.api_key:
        raise HTTPException(503, "Stripe not configured")

    # Verify Firebase token
    token = authorization.replace("Bearer ", "").strip()
    decoded = verify_token(token)
    if not decoded:
        raise HTTPException(401, "Authentication required")

    uid = decoded["uid"]

    try:
        session = stripe.checkout.Session.retrieve(session_id)
        if session.payment_status == "paid":
            customer_id = session.get("customer")
            set_user_premium(uid, customer_id)
            return {"status": "premium", "message": "ברוך הבא לניצוץ פרמיום! 🌟"}
        else:
            return {"status": "pending", "message": "התשלום עדיין בעיבוד"}
    except stripe.error.StripeError as e:
        raise HTTPException(400, f"Stripe error: {str(e)}")


@router.post("/webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(default="")):
    """
    Stripe webhook — handles subscription events automatically.
    Set webhook URL in Stripe Dashboard to: https://your-domain.com/payment/webhook
    Events to listen for: checkout.session.completed, customer.subscription.deleted
    """
    if not STRIPE_WEBHOOK_SECRET:
        return {"received": True}  # Dev mode

    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, STRIPE_WEBHOOK_SECRET
        )
    except stripe.error.SignatureVerificationError:
        raise HTTPException(400, "Invalid signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        if session.get("payment_status") == "paid":
            # Find user by email and mark premium
            customer_email = session.get("customer_details", {}).get("email")
            print(f"[payment] Checkout completed for {customer_email}")
            # In production: look up Firebase UID by email and call set_user_premium
            # For now: the /verify endpoint handles this via frontend redirect

    elif event["type"] == "customer.subscription.deleted":
        # Subscription cancelled — downgrade to free
        subscription = event["data"]["object"]
        customer_id = subscription.get("customer")
        print(f"[payment] Subscription cancelled for customer {customer_id}")
        # In production: find UID by stripeCustomerId and set plan to 'free'

    return {"received": True}
