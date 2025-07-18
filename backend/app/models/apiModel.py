import uuid
from datetime import datetime
from app import db
from sqlalchemy.dialects.postgresql import UUID

class ApiKey(db.Model):
    __tablename__ = 'api_keys'

    key_id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key_hash = db.Column(db.String(256), nullable=False)  # Store the hashed key
    user_id = db.Column(db.String, nullable=True)
    key_name = db.Column(db.String, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)
    last_used_at = db.Column(db.DateTime, nullable=True)
    usage_count = db.Column(db.Integer, default=0)

