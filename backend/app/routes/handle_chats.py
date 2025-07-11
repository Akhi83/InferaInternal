from flask import Blueprint, request, jsonify
from app import db
from app.models.chatModel import Chat
from app.models.messageModel import Message
from app.utils.clerk_auth import verify_clerk_token
from datetime import datetime
from sqlalchemy import desc

chat_bp = Blueprint("chats", __name__)

# 📥 POST /api/chats - Create a new chat
@chat_bp.route("/api/chats", methods=["POST"])
def create_chat():
    user = verify_clerk_token()
    user_id = user["sub"]

    data = request.get_json()
    title = data.get("title")
    if not title:
        return jsonify({"error": "Title is required"}), 400

    new_chat = Chat(
        user_id=user_id,
        title=title,
    )

    db.session.add(new_chat)
    db.session.commit()

    return jsonify(new_chat.to_dict()), 201

# 📤 GET /api/chats - Get all chats for the user
@chat_bp.route("/api/chats", methods=["GET"])
def get_chats():
    user = verify_clerk_token()
    user_id = user["sub"]

    chats = Chat.query.filter_by(user_id=user_id).order_by(desc(Chat.updated_at)).all()
    return jsonify([chat.to_dict() for chat in chats])


# ❌ DELETE /api/chats/<chat_id> - Delete a specific chat
@chat_bp.route("/api/chats/<uuid:chat_id>", methods=["DELETE"])
def delete_chat(chat_id):
    user = verify_clerk_token()
    user_id = user["sub"]

    chat = Chat.query.filter_by(chat_id=chat_id, user_id=user_id).first()
    if not chat:
        return jsonify({"error": "Chat not found or unauthorized"}), 404

    db.session.delete(chat)
    db.session.commit()
    return jsonify({"message": "Chat deleted"}), 200


# 📤 GET /api/chats/<chat_id>/messages - Get messages for a chat
@chat_bp.route("/api/chats/<uuid:chat_id>/messages", methods=["GET"])
def get_messages(chat_id):
    user = verify_clerk_token()
    user_id = user["sub"]

    chat = Chat.query.filter_by(chat_id=chat_id, user_id=user_id).first()
    if not chat:
        return jsonify({"error": "Chat not found or unauthorized"}), 404

    messages = Message.query.filter_by(chat_id=chat_id).order_by(Message.timestamp.asc()).all()
    return jsonify([m.to_dict() for m in messages])


# 📥 POST /api/chats/<chat_id>/messages - Add a message
@chat_bp.route("/api/chats/<uuid:chat_id>/messages", methods=["POST"])
def post_message(chat_id):
    user = verify_clerk_token()
    user_id = user["sub"]

    chat = Chat.query.filter_by(chat_id=chat_id, user_id=user_id).first()
    if not chat:
        return jsonify({"error": "Chat not found or unauthorized"}), 404

    data = request.get_json()
    text = data.get("text")
    sender = data.get("sender")

    if not text or sender not in ["user", "assistant"]:
        return jsonify({"error": "Invalid message payload"}), 400

    message = Message(
        chat_id=chat_id,
        sender=sender,
        text=text
    )
    chat.updated_at = datetime.utcnow()

    db.session.add(message)
    db.session.commit()

    return jsonify(message.to_dict()), 201
