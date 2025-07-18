from datetime import datetime
from flask import request, abort
from app.models.apiModel import ApiKey
from app.utils.key_utils import hash_api_key
from app import db

def verify_api_key():
    api_key = request.headers.get("x-api-key", None)
    if not api_key:
        abort(401, "Missing API Key")

    # hashed_key = hash_api_key(api_key)
    hashed_key = api_key
    
    db_key = ApiKey.query.filter_by(key_hash=hashed_key, is_active=True).first()
    if not db_key:
        abort(401, "Invalid or Inactive API Key")

    # Handle expiration
    if not db_key.is_active:
        abort(401, "API Key has expired")

    # Usage tracking
    db_key.last_used_at = datetime.utcnow()
    db_key.usage_count += 1
    db.session.commit()

    return db_key 
