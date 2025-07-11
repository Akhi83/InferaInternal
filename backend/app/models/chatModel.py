# app/models/chatModel.py
import uuid
from datetime import datetime
from app import db

class Chat(db.Model):
    __tablename__ = 'chats'
    __table_args__ = {'schema': 'public'}

    chat_id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(db.Text, nullable=False)
    title = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    messages = db.relationship('Message', backref='chat', cascade="all, delete-orphan", lazy=True)

    def to_dict(self, include_messages=False):
        data = {
            'chat_id': str(self.chat_id),
            'user_id': self.user_id,
            'title': self.title,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        if include_messages:
            data['messages'] = [message.to_dict() for message in self.messages]
        return data
