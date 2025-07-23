import os
import requests
from flask import request, abort
from jose import jwt, jwk
from jose.utils import base64url_decode
import time
import requests

# --- JWKS Cache ---
_jwks_cache = None
_jwks_expiry = 0

def get_cached_jwks(ttl=300):  # TTL = 5 minutes
    global _jwks_cache, _jwks_expiry
    now = time.time()
    if _jwks_cache is None or now > _jwks_expiry:
        res = requests.get(CLERK_JWKS_URL, timeout=2)
        res.raise_for_status()
        _jwks_cache = res.json()
        _jwks_expiry = now + ttl
    return _jwks_cache


CLERK_ISSUER = os.getenv("CLERK_ISSUER")
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL")

def get_authorization_type():
    auth = request.headers.get("Authorization", None)
    api_key = request.headers.get("x-api-key", None)

    if auth and auth.startswith("Bearer "):
        return "token"
    elif api_key:
        return "key"
    else:
        return None


def get_token_from_header():
    auth = request.headers.get("Authorization", None)
    if not auth or not auth.startswith("Bearer "):
        abort(401, "Missing or invalid Authorization header")
    return auth.split(" ")[1]

def get_public_key(token):
    jwks = get_cached_jwks()
    unverified_header = jwt.get_unverified_header(token)

    for key in jwks["keys"]:
        if key["kid"] == unverified_header["kid"]:
            return key
    abort(401, "Public key not found in JWKS")

def verify_clerk_token():
    token = get_token_from_header()
    public_key = get_public_key(token)

    try:
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            issuer=CLERK_ISSUER,
            options={
                "verify_aud": False  # Optional, set to True if using audience
            }
        )
        return payload  # contains user_id in `sub`
    except jwt.ExpiredSignatureError:
        abort(401, "Token has expired")
    except jwt.JWTClaimsError as e:
        abort(401, f"Invalid token claims: {str(e)}")
    except Exception as e:
        print("JWT verification failed:", e)
        abort(401, "Token verification failed")
