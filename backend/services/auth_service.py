"""Firebase Admin SDK — token verification + Firestore user management."""
import os
from functools import lru_cache
from dotenv import load_dotenv
load_dotenv()

_initialized = False
_db = None

def _init():
    global _initialized, _db
    if _initialized:
        return
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore

        # Support base64-encoded key for cloud deployments (Render, etc.)
        sa_key_b64 = os.environ.get("FIREBASE_SA_KEY_B64")
        key_path   = os.environ.get("FIREBASE_SERVICE_ACCOUNT_KEY", "serviceAccountKey.json")

        if sa_key_b64:
            import base64, json, tempfile
            key_data = json.loads(base64.b64decode(sa_key_b64).decode())
            cred = credentials.Certificate(key_data)
        elif os.path.exists(key_path):
            cred = credentials.Certificate(key_path)
        else:
            # Allow running without Firebase in local dev
            print("[auth] WARNING: No Firebase service account key found — auth disabled")
            _initialized = True
            return

        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        _db = firestore.client()
        _initialized = True
        print("[auth] Firebase Admin initialized OK")
    except Exception as e:
        print(f"[auth] Firebase init failed: {e} — running without auth")
        _initialized = True

def verify_token(id_token: str) -> dict | None:
    """Verify Firebase ID token. Returns decoded token dict or None."""
    _init()
    if _db is None:
        return None  # Auth disabled in dev mode
    try:
        from firebase_admin import auth
        return auth.verify_id_token(id_token)
    except Exception as e:
        print(f"[auth] Token verification failed: {e}")
        return None

def get_user_plan(uid: str) -> str:
    """Get user's plan from Firestore. Returns 'free' or 'premium'."""
    _init()
    if _db is None:
        return "premium"  # Dev mode: always premium
    try:
        doc = _db.collection("users").document(uid).get()
        if doc.exists:
            return doc.to_dict().get("plan", "free")
        return "free"
    except Exception:
        return "free"

def get_creation_count(uid: str, child_id: str) -> int:
    """Get creation count for a specific child."""
    _init()
    if _db is None:
        return 0  # Dev mode: no limit
    try:
        doc = _db.collection("users").document(uid)\
                 .collection("children").document(child_id).get()
        if doc.exists:
            return doc.to_dict().get("creationCount", 0)
        return 0
    except Exception:
        return 0

def increment_creation_count(uid: str, child_id: str):
    """Increment creation count for a child in Firestore."""
    _init()
    if _db is None:
        return
    try:
        from google.cloud.firestore_v1 import Increment
        ref = _db.collection("users").document(uid)\
                  .collection("children").document(child_id)
        ref.set({"creationCount": Increment(1)}, merge=True)
    except Exception as e:
        print(f"[auth] Increment creation count failed: {e}")

def set_user_premium(uid: str, stripe_customer_id: str = None):
    """Mark user as premium in Firestore."""
    _init()
    if _db is None:
        return
    try:
        data = {"plan": "premium"}
        if stripe_customer_id:
            data["stripeCustomerId"] = stripe_customer_id
        _db.collection("users").document(uid).set(data, merge=True)
        print(f"[auth] User {uid} marked as premium")
    except Exception as e:
        print(f"[auth] Set premium failed: {e}")
