from flask import Blueprint, request, jsonify
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from app import db
from app.models.database_connection import DatabaseConnection 
from app.utils.clerk_auth import verify_clerk_token
from app.utils.nl2sql_utils import get_db_schema
from app.utils.clerk_user_utils import get_clerk_user_email
from app.utils.supabase_utils import ensure_user_in_supabase
import json


database_bp = Blueprint('databases', __name__)
@database_bp.route("/api/databases", methods=["GET"])
def get_user_databases():
    user = verify_clerk_token()
    user_id = user["sub"]
    email = get_clerk_user_email(user_id)
    # print(f"[User Info] ID: {user_id}, Email: {email}")

    ensure_user_in_supabase(user_id, email)

    results = DatabaseConnection.query.filter_by(user_id=user_id).all()
    return jsonify([db.to_dict() for db in results])

@database_bp.route("/api/databases/<string:database_id>", methods=["GET"])
def get_database_by_id(database_id):
    user = verify_clerk_token()
    user_id = user["sub"]

    db_conn = DatabaseConnection.query.filter_by(database_id=database_id, user_id=user_id).first()

    if not db_conn:
        return jsonify({"error": "Database not found or unauthorized"}), 404

    return jsonify(db_conn.to_dict(include_string=True)), 200

@database_bp.route("/api/databases", methods=["POST"])
def add_database():
    user = verify_clerk_token()
    user_id = user["sub"]
    data = request.get_json()

    required_fields = ["database_string", "database_name", "database_type"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    db_string = data["database_string"]
    status = "Active"
    schema_json = None

    try:
        engine = create_engine(db_string)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as conn_error:
        return jsonify({
            "error": "Connection failed",
            "details": str(conn_error)
        }), 400

    try:
        schema = get_db_schema(engine)
        schema_json = json.dumps(schema)
    except Exception as schema_error:
        print(f"[Schema Error] {schema_error}")
        schema_json = json.dumps({})  # still save empty schema

    try:
        new_db = DatabaseConnection(
            user_id=user_id,
            database_string=db_string,
            database_name=data["database_name"],
            database_type=data["database_type"],
            database_status=status,
            database_schema_json=schema_json
        )
        db.session.add(new_db)
        db.session.commit()
        return jsonify(new_db.to_dict()), 201

    except Exception as insert_error:
        db.session.rollback()
        return jsonify({
            "error": "Failed to save database",
            "details": str(insert_error)
        }), 500

# routes/databases.py
@database_bp.route("/api/databases/<string:database_id>", methods=["DELETE"])
def delete_database(database_id):
    user = verify_clerk_token()  
    user_id = user["sub"]

    db_conn = DatabaseConnection.query.filter_by(database_id=database_id, user_id=user_id).first()

    if not db_conn:
        return jsonify({"error": "Database not found or unauthorized"}), 404

    db.session.delete(db_conn)
    db.session.commit()

    return jsonify({"message": "Database deleted"}), 200



@database_bp.route("/api/databases/<string:database_id>", methods=["PUT"])
def update_database(database_id):
    user = verify_clerk_token()
    user_id = user["sub"]

    data = request.get_json()
    db_conn = DatabaseConnection.query.filter_by(database_id=database_id, user_id=user_id).first()

    if not db_conn:
        return jsonify({"error": "Database not found or unauthorized"}), 404

    db_conn.database_type = data.get("database_type", db_conn.database_type)
    db_conn.database_string = data.get("database_string", db_conn.database_string)
    db_conn.database_name = data.get("database_name", db_conn.database_name)

    try:
        engine = create_engine(db_conn.database_string)
        schema = get_db_schema(engine)
        print("✅ Updated schema fetched:", schema)
        
        db_conn.database_schema_json = json.dumps(schema)
    except Exception as e:
        db_conn.status = "Inactive"
        print("❌ Failed to fetch updated schema:", e)

    db.session.commit()
    return jsonify(db_conn.to_dict())




