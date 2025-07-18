import secrets
import hashlib

def generate_api_key():
    return secrets.token_urlsafe(32)

def hash_api_key(api_key):
    return hashlib.sha256(api_key.encode()).hexdigest()

def verify_api_key(api_key, hashed):
    return hash_api_key(api_key) == hashed
