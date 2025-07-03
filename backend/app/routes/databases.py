from flask import Blueprint, request, jsonify
from app import db
from app.models.database_connection import DatabaseConnection
from app.utils.clerk_auth import verify_clerk_token

database_bp = Blueprint('databases', __name__)


@database_bp.route("/api/databases", methods=["GET", "POST"])
def handle_database():
    user = verify_clerk_token()
    user_id = user["sub"]

    if request.method == "GET":
        results = DatabaseConnection.query.filter_by(user_id=user_id).all()
        return jsonify([db.to_dict() for db in results]), 200

    elif request.method == "POST":
        data = request.get_json()

        required_fields = ["database_string", "database_name", "database_type"]
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing fields in request"}), 400

        new_db = DatabaseConnection(
            user_id=user_id,
            database_string=data["database_string"],
            database_name=data["database_name"],
            database_type=data["database_type"]
        )
        db.session.add(new_db)
        db.session.commit()

        return jsonify(new_db.to_dict()), 201


@database_bp.route("/api/databases/<string:database_id>", methods=["DELETE", "PUT"])
def handle_database_operations(database_id):
    user = verify_clerk_token()
    user_id = user["sub"]

    db_conn = DatabaseConnection.query.filter_by(database_id=database_id, user_id=user_id).first()
    if not db_conn:
        return jsonify({"error": "Database not found or unauthorized"}), 404

    if request.method == "DELETE":
        db.session.delete(db_conn)
        db.session.commit()
        return jsonify({"message": "Database deleted"}), 200

    elif request.method == "PUT":
        data = request.get_json()

        editable_fields = ["database_name", "database_string", "database_type"]
        updated = False

        for field in editable_fields:
            if field in data:
                setattr(db_conn, field, data[field])
                updated = True

        if updated:
            db.session.commit()
            return jsonify(db_conn.to_dict()), 200
        else:
            return jsonify({"error": "No valid fields provided for update"}), 400
