import uuid
import os, json
from app import db
from sqlalchemy import create_engine
from datetime import datetime, date
from app.utils.api_verification_utils import verify_api_key
from app.models.messageModel import Message
from flask import Blueprint, request, jsonify
from app.models.database_connection import DatabaseConnection
from app.models.apiModel import ApiKey
from app.utils.clerk_auth import verify_clerk_token, get_authorization_type
from app.utils.nl2sql_utils import get_openai_response, execute_query, get_db_schema , create_visualization
from app.utils.nl2sql_utils import get_openai_response, execute_query, get_db_schema, create_visualization, is_query_safe

llm_bp = Blueprint("llm", __name__)
def convert_dates(obj):
    if isinstance(obj, (date, datetime)):
        return obj.isoformat()
    return obj

@llm_bp.route("/api/query", methods=["POST"])
def handle_llm_query():

    auth = get_authorization_type()
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
            return jsonify({"error": "Database not found"}), 404

        database_id = db_obj.database_id
        history = data.get("history", [])

    elif not auth:
        return jsonify({"error" : "Invalid Authentication Header"}), 400


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
        return jsonify({"message": {
            "prompt": prompt,
            "response": f"Failed to load or fetch database schema: {e}"
        }}), 500


    llm_response, error = get_openai_response(prompt, schema, history, api_key=os.getenv("OPENAI_API_KEY"))
    if error:
        return jsonify({"message": {
            "prompt": prompt,
            "response": f"LLM Error: {error}"
        }}), 200
        
    generated_sql = llm_response.get("sql_query", "")
    
    # --- MODIFIED ERROR RESPONSE ---
    # This section is changed to return the simple text message you wanted.
    if not is_query_safe(generated_sql) or not generated_sql:
        return jsonify({"message": {
            "prompt": prompt,
            "response": "Your query is too broad, please provide a valid prompt."
        }}), 200
    
    df, err = execute_query(generated_sql, engine)
    if err:
        return jsonify({"message": {
            "prompt": prompt,
            "response": json.dumps({
                "query": generated_sql,
                "explanation": f"An error occurred while executing the query: {err}",
                "results": [],
                "visualization": {"type": "none"}
            })
        }}), 200
    
    visualization = create_visualization(df, llm_response)
    visualization_json = None
    
    if visualization and not (isinstance(visualization, dict) and 'error' in visualization):
        visualization_json = visualization.to_json()


    response_dict = {
        "query": llm_response["sql_query"],
        "explanation": llm_response["explanation"],
        "results": df,
        "visualization": {
            "type": llm_response["visualization"],
            "x_axis": llm_response.get("x_axis"),
            "y_axis": llm_response.get("y_axis"),
            "color": llm_response.get("color"),
            "title": llm_response.get("title"),
            "why": llm_response.get("visualization_explanation"),
            "figure_json": visualization_json  
        }
    }

    new_message = Message(
        message_id=str(uuid.uuid4()),
        chat_id=data.get("chat_id", None),
        user_id=user_id,
        prompt=prompt,
        response=json.dumps(response_dict, default=convert_dates),
    )
    db.session.add(new_message)
    db.session.commit()

    return jsonify({"message": {
        "prompt": prompt,
        "response": json.dumps(response_dict, default=convert_dates)
    }})
