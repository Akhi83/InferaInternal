import os
import requests
from flask import request, abort
from jose import jwt, jwk
from jose.utils import base64url_decode

CLERK_ISSUER = os.getenv("CLERK_ISSUER")
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL")

def get_token_from_header():
    auth = request.headers.get("Authorization", None)
    if not auth or not auth.startswith("Bearer "):
        abort(401, "Missing or invalid Authorization header")
    return auth.split(" ")[1]

def get_public_key(token):
    jwks = requests.get(CLERK_JWKS_URL).json()
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
