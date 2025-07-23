# app/routes/llm.py
import uuid
import os
import json
from datetime import datetime, date
from flask import Blueprint, request, jsonify
from sqlalchemy import create_engine
from app import db, limiter
from app.models.messageModel import Message
from app.models.database_connection import DatabaseConnection
from app.models.apiModel import ApiKey
from app.utils.clerk_auth import verify_clerk_token, get_authorization_type
from app.utils.api_verification_utils import verify_api_key
from flask_limiter.errors import RateLimitExceeded
from app.utils.nl2sql_utils import (
    get_openai_response,
    execute_query,
    get_db_schema,
    create_visualization,
    is_query_safe
)

API_LIMIT = os.getenv("API_USAGE_LIMIT")

# === Limiter Config ===
def get_api_key_from_request():
    return request.headers.get("x-api-key")


llm_bp = Blueprint("llm", __name__)
def convert_dates(obj):
    if isinstance(obj, (date, datetime)):
        return obj.isoformat()
    return obj

def return_error(prompt, response_msg, code):
    return jsonify({"message": {
        "prompt": prompt,
        "response": response_msg
    }}), code

# === Route ===
@llm_bp.route("/api/query", methods=["POST"])
@limiter.limit(f"{API_LIMIT}", key_func=get_api_key_from_request)
def handle_llm_query():
    try:
        auth = get_authorization_type()
        history = []
        if auth == "token":
            user = verify_clerk_token()
            user_id = user["sub"]

            data = request.get_json()
            prompt = data.get("prompt")
            database_id = data.get("database_id")
            history = data.get("history", [])

        elif auth == "key":
            db_key = verify_api_key()
            data = request.get_json()
            prompt = data.get("prompt")
            database_name = data.get("database_name")
            user_id = db_key.user_id

            db_obj = DatabaseConnection.query.filter_by(database_name=database_name, user_id=user_id).first()
            if not db_obj:
                return return_error(prompt, "Database not found", 404)

            database_id = db_obj.database_id  # optional, only if you still need the id
            history = data.get("history", [])

        else:
            return jsonify({"error": "Invalid Authentication Header"}), 400

        if not prompt or not database_id:
            return jsonify({"error": "Missing prompt or database_id"}), 400

        db_obj = DatabaseConnection.query.filter_by(database_id=database_id, user_id=user_id).first()
        if not db_obj:
            return return_error(prompt, "Failed to locate database", 404)

        # === Connect to DB ===
        try:
            engine = create_engine(db_obj.database_string)
        except Exception as e:
            print(str(e))
            return return_error(prompt, "Failed to connect to the database", 500)

        # === Load schema ===
        try:
            if db_obj.database_schema_json and db_obj.database_schema_json != "{}":
                schema = json.loads(db_obj.database_schema_json)
            else:
                schema = get_db_schema(engine)
                db_obj.database_schema_json = json.dumps(schema)
                db.session.commit()
        except Exception as e:
            print(str(e))
            return return_error(prompt, "Failed to load or fetch database schema", 500)

        # === Get LLM Response ===
        llm_response, error = get_openai_response(
            prompt, schema, history, api_key=os.getenv("OPENAI_API_KEY")
        )
        if error:
            print(error)
            return return_error(prompt, "LLM failed to generate a response", 200)
        

        generated_sql = llm_response.get("sql_query", "")
        if not is_query_safe(generated_sql) or not generated_sql:
            return return_error(prompt, "Please provide a valid prompt", 200)

        df, err = execute_query(generated_sql, engine)
        if err:
            print(err)
            return return_error(prompt, "Failed to generate a valid Query. Please refine your prompt.", 200)

        # === Visualization ===
        visualization = create_visualization(df, llm_response)
        visualization_json = None
        if visualization and not (isinstance(visualization, dict) and 'error' in visualization):
            visualization_json = visualization.to_json()

        response_dict = {
            "query": llm_response["sql_query"],
            "explanation": llm_response["explanation"],
            "results": df.to_dict(orient="records"),
            "visualization": {
                "type": llm_response["visualization"],
                "x_axis": llm_response["x_axis"],
                "y_axis": llm_response["y_axis"],
                "color": llm_response.get("color"),
                "title": llm_response["title"],
                "why": llm_response["visualization_explanation"],
                "figure_json": visualization_json
            }
        }

        if auth == "key":
            db_key.last_used_at = datetime.utcnow()
            db_key.usage_count += 1

        # === Save message ===
        new_message = Message(
            message_id=str(uuid.uuid4()),
            chat_id=data.get("chat_id", None),
            user_id=user_id,
            prompt=prompt,
            response=json.dumps(response_dict, default=convert_dates),
        )
        db.session.add(new_message)
        db.session.commit()

        return jsonify({
            "message": {
                "prompt": prompt,
                "response": json.dumps(response_dict, default=convert_dates)
            }
        })

    except RateLimitExceeded as e:
        return jsonify({
            "error": "Rate limit exceeded",
            "details": str(e.description)
        }), 429
