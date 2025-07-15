# app/routes/llm.py
from flask import Blueprint, request, jsonify
from app import db
from app.models.database_connection import DatabaseConnection
from app.utils.clerk_auth import verify_clerk_token
from app.utils.nl2sql_utils import get_openai_response, execute_query, get_db_schema , create_visualization
from sqlalchemy import create_engine
from app.models.messageModel import Message
import uuid
from datetime import datetime
import os, json
from datetime import date, datetime

llm_bp = Blueprint("llm", __name__)
def convert_dates(obj):
    if isinstance(obj, (date, datetime)):
        return obj.isoformat()
    return obj
@llm_bp.route("/api/query", methods=["POST"])

def handle_llm_query():
    user = verify_clerk_token()
    user_id = user["sub"]

    data = request.get_json()
    prompt = data.get("prompt")
    database_id = data.get("database_id")
    chat_id = data.get("chat_id")

    if not prompt or not database_id:
        return jsonify({"error": "Missing prompt or database_id"}), 400

    db_obj = DatabaseConnection.query.filter_by(database_id=database_id, user_id=user_id).first()
    if not db_obj:
        return jsonify({"error": "Database not found"}), 404

    try:
        engine = create_engine(db_obj.database_string)
    except Exception as e:
        return jsonify({"error": f"Failed to connect to database: {str(e)}"}), 500

    try:
        if db_obj.database_schema_json and db_obj.database_schema_json != "{}":
            schema = json.loads(db_obj.database_schema_json)
        else:
            schema = get_db_schema(engine)
            db_obj.database_schema_json = json.dumps(schema)
            db.session.commit()
    except Exception as e:
        return jsonify({"error": f"Failed to load or fetch schema: {str(e)}"}), 500

    llm_response, error = get_openai_response(prompt, schema, api_key=os.getenv("OPENAI_API_KEY"))
    if error:
        return jsonify({"message": {
            "prompt": prompt,
            "response": f"LLM Error: {error}"
        }}), 200

    df, err = execute_query(llm_response["sql_query"], engine)
    if err:
        return jsonify({"message": {
            "prompt": prompt,
            "response": f"SQL Error: {err}"
        }}), 200
    
    visualization = create_visualization(df, llm_response)
    visualization_json = visualization.to_json() if visualization else None

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
        "figure_json": visualization_json  # 🆕 Add this
    }
    }

    new_message = Message(
    message_id=str(uuid.uuid4()),
    # sender='user',
    chat_id=chat_id,
    user_id=user_id,
    prompt=prompt,
    response=json.dumps(response_dict, default=convert_dates),

    # created_at=datetime.utcnow()
    )
    db.session.add(new_message)
    db.session.commit()

    return jsonify({"message": {
        "prompt": prompt,
        "response": json.dumps(response_dict, default=convert_dates)

    }})
