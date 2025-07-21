import uuid
from flask import Blueprint, jsonify, request
from app import db
from app.models.apiModel import ApiKey
from app.utils.key_utils import hash_api_key, generate_api_key
from app.utils.clerk_auth import verify_clerk_token
from datetime import datetime, timedelta

api_key_bp = Blueprint("api_keys", __name__)

# Create API Key
@api_key_bp.route("/api/generate_api_key", methods=["POST"])
def create_api_key():
    user = verify_clerk_token()
    user_id = user['sub'] 
    
    data = request.get_json()
    key_name = data.get("key_name", "Unnamed Key")
    expiry_days = data.get("expires_in_days", None)

    expiry_date = None
    if expiry_days:
        expiry_date = datetime.utcnow() + timedelta(days=int(expiry_days))


    raw_key = generate_api_key()
    hashed_key = hash_api_key(raw_key)
    key_id = uuid.uuid4()

    new_key = ApiKey(
        key_id=key_id,
        user_id=user_id,
        key_name=key_name,
        key_hash=raw_key,
        expires_at=expiry_date
    )

    db.session.add(new_key)
    db.session.commit()

    return jsonify({
       "message" : "Key Created Successfully"
    }), 201

# Delete API Key
@api_key_bp.route("/api/delete_api_key", methods=["POST"])
def delete_api_key():
    user = verify_clerk_token()
    user_id = user["sub"]

    data = request.get_json()
    raw_key_id = data.get('key_id')

    if not raw_key_id:
        return jsonify({"error": "Missing key_id"}), 400

    try:
        key_id = uuid.UUID(raw_key_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid key_id format"}), 400

    api_key = ApiKey.query.filter_by(key_id=key_id, user_id=user_id).first()

    if not api_key:
        return jsonify({"error": "API key not found"}), 404

    db.session.delete(api_key)
    db.session.commit()

    return jsonify({
        "key_id": str(key_id),
        "message": "API key has been deleted successfully"
    })

# Reset API Key (Rotate)
@api_key_bp.route("/api/reset_api_key", methods=["POST"])
def reset_api_key():
    user = verify_clerk_token()
    user_id = user["sub"]

    data = request.get_json()
    raw_key_id = data.get('key_id')

    if not raw_key_id:
        return jsonify({"error": "Missing key_id"}), 400

    try:
        key_id = uuid.UUID(raw_key_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid key_id format"}), 400

    api_key = ApiKey.query.filter_by(key_id=key_id, user_id=user_id).first()

    if not api_key:
        return jsonify({"error": "API key not found"}), 404

    raw_key = generate_api_key()
    hashed_key = hash_api_key(raw_key)

    # api_key.key_hash = hashed_key
    api_key.key_hash = raw_key
    api_key.last_used_at = None
    db.session.commit()

    return jsonify({
        "key_id": str(api_key.key_id),
        "new_key": raw_key,  
        "key_name": api_key.key_name,
        "message": "API key has been reset successfully"
    })


# Add to your api_key_bp in app/routes/api_keys.py

@api_key_bp.route("/api/list_api_keys", methods=["GET"])
def list_api_keys():
    user = verify_clerk_token()
    user_id = user["sub"]

    keys = ApiKey.query.filter_by(user_id=user_id).all()

    result = []
    for key in keys:
        expired = key.expires_at and datetime.utcnow() > key.expires_at
        result.append({
            "key_id": str(key.key_id),
            "key_name": key.key_name,
            "key": key.key_hash,
            "created_at": key.created_at.isoformat(),
            "expires_at": key.expires_at.isoformat() if key.expires_at else None,
            "last_used_at": key.last_used_at.isoformat() if key.last_used_at else None,
            "usage_count": key.usage_count,
            "is_active": not expired
        })

    return jsonify({"keys": result})



def is_key_valid(api_key_obj):
    if not api_key_obj.is_active:
        return False
    if api_key_obj.expires_at and datetime.utcnow() > api_key_obj.expires_at:
        return False
    return True

