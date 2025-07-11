# app/models/messageModel.py
import uuid
from datetime import datetime
from app import db

class Message(db.Model):
    __tablename__ = 'messages'
    __table_args__ = {'schema': 'public'}

    message_id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chat_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey('public.chats.chat_id'), nullable=False)
    user_id = db.Column(db.Text, nullable=False)
    prompt = db.Column(db.Text)
    response = db.Column(db.Text)
    timestamp = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        db.CheckConstraint("sender IN ('user', 'assistant')", name='valid_sender'),
        {'schema': 'public'}
    )

    def to_dict(self):
        return {
            'message_id': str(self.message_id),
            'chat_id': str(self.chat_id),
            'user_id': self.user_id,
            'prompt': self.prompt,
            'response': self.response,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }
