import json
import re
import pandas as pd
from sqlalchemy import text, inspect
from openai import OpenAI
import os
import plotly.express as px
from datetime import datetime, date
from decimal import Decimal
import uuid

def safe_serialize(obj):
    """ Safely serializes complex data types to be JSON-compatible. """
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, uuid.UUID):
        return str(obj)
    if isinstance(obj, dict):
        return {key: safe_serialize(value) for key, value in obj.items()}
    if isinstance(obj, list):
        return [safe_serialize(item) for item in obj]
    # Add other types if necessary
    return obj

def get_db_schema(engine):
    """
    Introspects the database to get schema information, including table names,
    columns, types, and foreign keys.
    """
    schema = {}
    try:
        inspector = inspect(engine)
        for table_name in inspector.get_table_names():
            columns = []
            for col in inspector.get_columns(table_name):
                columns.append({
                    "name": col["name"],
                    "type": str(col["type"]),
                    "description": "" # Placeholder for user annotations
                })
            
            # Get foreign keys for join information
            foreign_keys = []
            for fk in inspector.get_foreign_keys(table_name):
                foreign_keys.append({
                    "constrained_columns": fk['constrained_columns'],
                    "referred_table": fk['referred_table'],
                    "referred_columns": fk['referred_columns']
                })

            schema[table_name] = {
                "columns": columns,
                "foreign_keys": foreign_keys,
                "description": "" # Placeholder for user annotations
            }
    except Exception as e:
        raise RuntimeError(f"Failed to introspect schema: {str(e)}")
    return schema


def execute_query(sql_query, engine):
    """ Executes a SQL query and returns the results as a DataFrame. """
    try:
        # Basic check to prevent multiple statements
        if ';' in sql_query.strip().rstrip(';'):
            return None, "Only one SQL statement is allowed."
        with engine.connect() as conn:
            df = pd.read_sql_query(text(sql_query), conn)
        # Serialize DataFrame to handle complex types before sending to frontend
        return json.loads(df.to_json(orient='records', default_handler=str)), None
    except Exception as e:
        return None, str(e)

def get_openai_response(question, schema_info, history=[], api_key=None):
    """
    Generates a SQL query by sending a structured request to the OpenAI API.
    """
    api_key = api_key or os.getenv("OPENAI_API_KEY")
    if not api_key:
        return {"error": "OpenAI API key is not configured."}, None
    
    formatted_history = ""
    if history:
        for msg in history:
            formatted_history += f"User: {msg['prompt']}\n"
            try:
                response_json = json.loads(msg['response'])
                explanation = response_json.get('explanation', '')
                sql = response_json.get('query', '')
                formatted_history += f"Assistant:\nExplanation: {explanation}\nSQL: {sql}\n\n"
            except (json.JSONDecodeError, TypeError):
                 formatted_history += f"Assistant: {msg['response']}\n\n"

    # --- REVISED AND SIMPLIFIED PROMPT ENGINEERING ---

    # 1. The System Prompt: Contains all instructions for the AI.
    system_prompt = """You are an expert SQL analyst. Your task is to generate a SQL query to answer a user's question based on the provided database schema.

    **Instructions:**
    1.  **Analyze the Schema**: The user will provide a schema with table names, column names, types, and descriptions. Use the `description` fields to understand the business context.
    2.  **Plan Joins**: If the user's question requires data from multiple tables, use the `foreign_keys` information in the schema to construct the correct JOIN clauses.
    3.  **Safety First**: Never generate queries that modify the database (UPDATE, INSERT, DELETE, DROP, etc.). If the user asks for something unsafe or outside the schema's scope, respond that you cannot fulfill the request.
    4.  **Strict JSON Output**: You MUST respond ONLY with a single, valid JSON object in the specified format. Do not include any other text, greetings, or explanations outside of the JSON structure.
    5.  **Pay Attention to Aliases (Very Important)**: When you select a column, you MUST use the correct table alias. For example, if `PaymentMethod` is in the `payments` table aliased as `pay`, you must use `pay.PaymentMethod`, not an alias from a different table.
    6.  **Visualization**: Strictly generate and include appropriate visualization details in the response. Do not set figure_json to null.

    **HOW TO HANDLE CONVERSATION HISTORY (VERY IMPORTANT):**
    - The user may ask follow-up questions.To tackle this, you must:
    - Look at the `CONVERSATION HISTORY` section below to understand the context of the user's question. And then refer to the results of the previous queries.
    - Modify the last SQL query from the history to answer the new question if you think the new question fits in the context of the previous one, rather than treating the new question in isolation.
    - If the last query is not relevant, then treat the new question in isolation and generate a new query from scratch.
    - If the last query is relevant, you can modify it to answer the new question.
    

    **JSON Output Format:**
        {
            "explanation": "A brief explanation of your query, including which tables are being joined and why.",
            "sql_query": "A single, complete, and valid SQL query. If the request is invalid or unsafe, this must be an empty string.",
            "visualization": "bar/line/scatter/pie/box/violin/histogram",
            "visualization_explanation": "Why this visualization type is appropriate.",
            "x_axis": "Column name for the x-axis (if applicable, e.g., for bar, line).",
            "y_axis": "Column name for the y-axis (if applicable, e.g., for bar, line).",
            "names_axis": "Column name for categorical names (if applicable, e.g., for pie).",
            "values_axis": "Column name for values (if applicable, e.g., for pie).",
            "title": "A descriptive title for the visualization.",
            "color": "Column name for color differentiation (optional)."
        }
    """

    # 2. The User Prompt: Contains the data (schema) and the specific question.
    user_prompt = f"""
    DATABASE SCHEMA:
    {json.dumps(schema_info, indent=2)}

    CONVERSATION HISTORY:
    {formatted_history}
    USER QUESTION:
    {question}
    """

    # 3. Construct the message list for the API
    messages = [{"role": "system", "content": system_prompt}]
    
    # Add the past conversation history
    for message in history:
        if isinstance(message, dict) and 'prompt' in message and 'response' in message:
            messages.append({"role": "user", "content": message['prompt']})
            # The assistant's response should be the JSON string it previously generated
            messages.append({"role": "assistant", "content": message['response']})

    # Add the final user prompt with the schema and new question
    messages.append({"role": "user", "content": user_prompt})

    try:
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.0,  # Set to 0 for deterministic and accurate SQL generation
            response_format={"type": "json_object"} # Enforce JSON output
        )
        
        # The response content should already be a valid JSON object
        json_result = json.loads(response.choices[0].message.content)
        return json_result, None

    except Exception as e:
        return None, f"Error communicating with OpenAI API: {str(e)}"

def create_visualization(df, viz_info):
    """ Creates a Plotly figure from a DataFrame and visualization info. """
    if not isinstance(df, pd.DataFrame):
        df = pd.DataFrame(df)
    
    viz_type = viz_info.get("visualization", "none")
    if viz_type == "none" or df.empty:
        return None
    
    x_axis = viz_info.get("x_axis")
    y_axis = viz_info.get("y_axis")
    names_axis = viz_info.get("names_axis")
    values_axis = viz_info.get("values_axis")
    title = viz_info.get("title", "Data Visualization")
    color = viz_info.get("color")
    
    if not color:
        color = None
        
    try:
        if viz_type == "bar":
            if x_axis not in df.columns or y_axis not in df.columns:
                return {"error": f"Required columns 'x_axis' or 'y_axis' not found for bar plot."}
            fig = px.bar(data_frame=df, x=x_axis, y=y_axis, color=color, title=title)
        
        elif viz_type == "line":
            if x_axis not in df.columns or y_axis not in df.columns:
                return {"error": f"Required columns 'x_axis' or 'y_axis' not found for line plot."}
            fig = px.line(data_frame=df, x=x_axis, y=y_axis, color=color, title=title)
        
        elif viz_type == "pie":
            if names_axis not in df.columns or values_axis not in df.columns:
                return {"error": f"Required columns 'names_axis' or 'values_axis' not found for pie chart."}
            fig = px.pie(data_frame=df, names=names_axis, values=values_axis, title=title)
        
        elif viz_type == "scatter":
            if x_axis not in df.columns or y_axis not in df.columns:
                return {"error": f"Required columns 'x_axis' or 'y_axis' not found for scatter plot."}
            fig = px.scatter(data_frame=df, x=x_axis, y=y_axis, color=color, title=title)
        
        elif viz_type == "histogram":
            if x_axis not in df.columns:
                return {"error": f"Required column 'x_axis' not found for histogram."}
            fig = px.histogram(data_frame=df, x=x_axis, color=color, title=title)
        
        elif viz_type == "box":
            if x_axis and x_axis in df.columns and y_axis and y_axis in df.columns:
                fig = px.box(data_frame=df, x=x_axis, y=y_axis, color=color, title=title)
            elif y_axis and y_axis in df.columns:
                fig = px.box(data_frame=df, y=y_axis, color=color, title=title)
            else:
                return {"error": f"Required columns 'y_axis' (and optionally 'x_axis') not found for box plot."}

        
        elif viz_type == "violin":
            if x_axis not in df.columns or y_axis not in df.columns:
                return {"error": f"Required columns 'x_axis' or 'y_axis' not found for violin plot."}
            fig = px.violin(data_frame=df, x=x_axis, y=y_axis, color=color, title=title)
        
        elif viz_type == "none":
            return {"message": "No visualization required here."}
        else:
            return {"error": f"Unsupported visualization type: {viz_type}"}
        
        return fig
    
    except Exception as e:
        return {"error": f"Error creating visualization: {str(e)}"}


def is_query_safe(sql_query):
    """ A basic check for potentially unsafe SQL queries. """
    if not sql_query or not isinstance(sql_query, str):
        return True
    
    query_lower = sql_query.lower().strip()
    
    # Block DML/DDL statements
    disallowed_keywords = ['insert', 'update', 'delete', 'drop', 'alter', 'truncate', 'grant', 'revoke']
    if any(query_lower.startswith(keyword) for keyword in disallowed_keywords):
        return False
        
    # Block access to system tables
    if 'information_schema' in query_lower or 'pg_catalog' in query_lower:
        return False

    return True
