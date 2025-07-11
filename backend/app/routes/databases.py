from flask import Blueprint, request, jsonify
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from app import db
from app.models.database_connection import DatabaseConnection 
from app.utils.clerk_auth import verify_clerk_token
from app.utils.nl2sql_utils import get_db_schema
from app.utils.clerk_user_utils import get_clerk_user_email
# from app.supabase_client import supabase
from app.utils.supabase_utils import ensure_user_in_supabase
import json


database_bp = Blueprint('databases', __name__)


@database_bp.route("/api/databases", methods=["GET"])
def get_user_databases():
    user = verify_clerk_token()
    user_id = user["sub"]

    results = DatabaseConnection.query.filter_by(user_id=user_id).all()
    return jsonify([db.to_dict() for db in results])

@database_bp.route("/api/databases", methods=["POST"])
def add_database():
    user = verify_clerk_token()
    print("User payload:", user)
    user_id = user["sub"]
    email = get_clerk_user_email(user_id)
    print(f"[User Info] ID: {user_id}, Email: {email}")

    ensure_user_in_supabase(user_id, email)

    data = request.get_json()

    # ✅ Validate input
    required_fields = ["database_string", "database_name", "database_type"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    db_string = data["database_string"]
    status = "Active"
    schema_json = None

    # ✅ Try to connect and fetch schema
    try:
        engine = create_engine(db_string)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))

        # If connection succeeds, try fetching schema
        try:
            schema = get_db_schema(engine)
            schema_json = json.dumps(schema)
        except Exception as schema_error:
            # Schema fetching failed — still allow creation but mark schema empty
            schema_json = json.dumps({})
            print(f"[Schema Error] {schema_error}")

    except Exception as conn_error:
        status = "Inactive"
        schema_json = json.dumps({})
        print(f"[Connection Error] {conn_error}")

    # ✅ Create and save database record
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

# routes/databases.py

@database_bp.route("/api/databases/<string:database_id>", methods=["DELETE"])
def delete_database(database_id):
    user = verify_clerk_token()  # get current logged-in user
    user_id = user["sub"]

    # Fetch the actual record (not just a query)
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

    # Update fields
    db_conn.database_type = data.get("database_type", db_conn.database_type)
    db_conn.database_string = data.get("database_string", db_conn.database_string)
    db_conn.database_name = data.get("database_name", db_conn.database_name)

    # 🔁 Re-fetch schema after connection string update
    try:
        engine = create_engine(db_conn.database_string)
        schema = get_db_schema(engine)
        print("✅ Updated schema fetched:", schema)
        db_conn.database_schema_json = json.dumps(schema)
    except Exception as e:
        print("❌ Failed to fetch updated schema:", e)

    db.session.commit()
    return jsonify(db_conn.to_dict())




