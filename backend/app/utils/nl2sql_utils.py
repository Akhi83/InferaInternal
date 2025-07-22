import json
import re
import pandas as pd
import random
from sqlalchemy import text, inspect
from openai import OpenAI
import os
import plotly.express as px

# for Serialization
from datetime import datetime, date
from decimal import Decimal
import uuid

def safe_serialize(obj):
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    elif isinstance(obj, Decimal):
        return float(obj)  # or str(obj) for exact string representation
    elif isinstance(obj, (bytes, uuid.UUID)):
        return str(obj)
    elif isinstance(obj, dict):
        return {key: safe_serialize(value) for key, value in obj.items()}
    elif isinstance(obj, (list, tuple, set)):
        return [safe_serialize(item) for item in obj]
    else:
        return obj  # JSON-safe primitive (int, float, str, bool, None)


# Get schema from SQLAlchemy engine
def get_db_schema(engine):
    schema = {}
    try:
        with engine.connect() as connection:
            inspector = inspect(engine)

            for table_name in inspector.get_table_names():
                # Get column metadata
                columns_info = inspector.get_columns(table_name)
                col_info = []
                for col in columns_info:
                    col_info.append({
                        "name": col["name"],
                        "type": str(col["type"]),
                        "primary_key": col.get("primary_key", False)
                    })

                # Get sample rows
                try:
                    result = connection.execute(text(f"SELECT * FROM {table_name} LIMIT 3"))
                    rows = [safe_serialize(dict(row._mapping)) for row in result]
                except Exception as e:
                    rows = []

                # Store both columns and sample rows
                schema[table_name] = {
                    "columns": col_info,
                    "sample_rows": rows
                }

    except Exception as e:
        raise RuntimeError(f"Failed to introspect schema: {str(e)}")

    return schema

# Execute SQL query and return results as DataFrame
def execute_query(sql_query, engine):
    try:
        if ';' in sql_query.strip().rstrip(';'):
            return None, "Only one SQL statement is allowed. Please modify your query."

        with engine.connect() as conn:
            df = pd.read_sql_query(text(sql_query), conn)
        return df, None
    except Exception as e:
        return None, str(e)


# Get OpenAI-generated SQL and metadata, or fallback to sample response
# In backend/app/utils/nl2sql_utils.py

# 1. Update the function signature
def get_openai_response(question, schema_info, history=[], api_key=None):
    api_key = api_key or os.getenv("OPENAI_API_KEY")

    if not api_key:
        return get_sample_llm_response(question), None

    # 2. Format the history for the prompt
    formatted_history = ""
    if history:
        for msg in history:
            formatted_history += f"User: {msg['prompt']}\n"
            # We parse the response if it's a JSON string to get the explanation
            try:
                response_json = json.loads(msg['response'])
                explanation = response_json.get('explanation', '')
                sql = response_json.get('query', '')
                formatted_history += f"Assistant:\nExplanation: {explanation}\nSQL: {sql}\n\n"
            except (json.JSONDecodeError, TypeError):
                 formatted_history += f"Assistant: {msg['response']}\n\n"


    # 3. Update the agent prompt
    agent_prompt = f"""You are an expert in SQL and data analysis. Based on the database schema and conversation history below, generate a SQL query to answer the user's question.

DATABASE SCHEMA:
{json.dumps(schema_info, indent=2)}

CONVERSATION HISTORY:
{formatted_history}
USER QUESTION: {question}
SECURITY INSTRUCTIONS:
- NEVER generate a query that selects all columns from a table (e.g., SELECT *). You MUST specify the exact columns needed.
- NEVER generate a query that lists all tables or reveals the entire database schema.
- If the user asks a question that is too broad (like "Show me the entire database" or "List all customers"), your "explanation" must state that the query is too broad and the "sql_query" should be an empty string.
Provide your response in the following JSON format:
{{
    "explanation": "Brief explanation of how you'll solve this, considering the conversation history.If the query is too broad, explain why.",
    "sql_query": "A single SQL query. If the user is asking for a modification of the previous query (e.g., 'show top 5'), modify the last SQL query from the history.If the user's request is too broad or unsafe, return an empty string.",
    "visualization": "none/bar/line/pie/scatter",
    "visualization_explanation": "Why this visualization type is appropriate (or why none is needed)",
    "x_axis": "Column name for x-axis if visualization needed",
    "y_axis": "Column name for y-axis if visualization needed",
    "title": "Suggested title for the visualization",
    "color": "Column name for color differentiation if applicable (optional)"
}}
Only include a visualization if it would meaningfully enhance understanding of the data.
Be careful to use only tables and columns that exist in the schema. Use Correct Table and Column Names.
"""

    try:
        client = OpenAI(api_key=api_key)
        
        # 4. Construct the messages list for the API
        messages_for_api = [
            {"role": "system", "content": "You are a SQL and data visualization expert."}
        ]
        # Add history to the messages list
        for msg in history:
            messages_for_api.append({"role": "user", "content": msg['prompt']})
            messages_for_api.append({"role": "assistant", "content": msg['response']})
        # Add the new user question
        messages_for_api.append({"role": "user", "content": agent_prompt})

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages_for_api, # Use the new list
            temperature=0.001
        )

        content = response.choices[0].message.content.strip()
        match = re.search(r'({[\s\S]*})', content)
        if not match:
            return None, "OpenAI did not return a valid JSON format."

        json_result = json.loads(match.group(1))
        return json_result, None

    except Exception as e:
        return None, f"Error with OpenAI API: {str(e)}"
# def get_openai_response(question, schema_info, api_key=None):
#     api_key = api_key or os.getenv("OPENAI_API_KEY")

#     if not api_key:
#         return get_sample_llm_response(question), None

#     agent_prompt = f"""You are an expert in SQL and data analysis. Based on the database schema below, generate a SQL query to answer the user's question.

# DATABASE SCHEMA:
# {json.dumps(schema_info, indent=2)}
# USER QUESTION: {question}
# Provide your response in the following JSON format:
# {{
#     "explanation": "Brief explanation of how you'll solve this",
#     "sql_query": "A single SQL query (do not return multiple statements). If needed, use JOINs or UNIONs.",
#     "visualization": "none/bar/line/pie/scatter",
#     "visualization_explanation": "Why this visualization type is appropriate (or why none is needed)",
#     "x_axis": "Column name for x-axis if visualization needed",
#     "y_axis": "Column name for y-axis if visualization needed",
#     "title": "Suggested title for the visualization",
#     "color": "Column name for color differentiation if applicable (optional)"
# }}
# Only include a visualization if it would meaningfully enhance understanding of the data.
# Be careful to use only tables and columns that exist in the schema. Use Correct Table and Column Names.
# """

#     try:
#         client = OpenAI(api_key=api_key)
#         response = client.chat.completions.create(
#             model="gpt-4o-mini",
#             messages=[
#                 {"role": "system", "content": "You are a SQL and data visualization expert."},
#                 {"role": "user", "content": agent_prompt}
#             ],
#             temperature=0.001
#         )

#         content = response.choices[0].message.content.strip()
#         match = re.search(r'({[\s\S]*})', content)
#         if not match:
#             return None, "OpenAI did not return a valid JSON format."

#         json_result = json.loads(match.group(1))
#         return json_result, None

#     except Exception as e:
#         return None, f"Error with OpenAI API: {str(e)}"


# Function to create visualization based on dataframe and visualization type
def create_visualization(df, viz_info):
    viz_type = viz_info.get("visualization", "none")
    
    if viz_type == "none" or df.empty:
        return None
    
    x_axis = viz_info.get("x_axis")
    y_axis = viz_info.get("y_axis")
    title = viz_info.get("title", "Data Visualization")
    color = viz_info.get("color")
    
    # Check if the specified columns exist in the dataframe
    if x_axis and x_axis not in df.columns:
        return {"error": f"Column '{x_axis}' not found in query results"}
    if y_axis and y_axis not in df.columns:
        return {"error": f"Column '{y_axis}' not found in query results"}
    if color and color not in df.columns:
        color = None  # Make color optional
    
    try:
        if viz_type == "bar":
            if color:
                fig = px.bar(df, x=x_axis, y=y_axis, color=color, title=title)
            else:
                fig = px.bar(df, x=x_axis, y=y_axis, title=title)
            return fig
        
        elif viz_type == "line":
            if color:
                fig = px.line(df, x=x_axis, y=y_axis, color=color, title=title)
            else:
                fig = px.line(df, x=x_axis, y=y_axis, title=title)
            return fig
        
        elif viz_type == "pie":
            fig = px.pie(df, names=x_axis, values=y_axis, title=title)
            return fig
        
        elif viz_type == "scatter":
            if color:
                fig = px.scatter(df, x=x_axis, y=y_axis, color=color, title=title)
            else:
                fig = px.scatter(df, x=x_axis, y=y_axis, title=title)
            return fig
        
        else:
            return {"error": f"Unsupported visualization type: {viz_type}"}
    
    except Exception as e:
        return {"error": f"Error creating visualization: {str(e)}"}

# Add this new function in backend/app/utils/nl2sql_utils.py

def is_query_safe(sql_query):
    """
    Analyzes a SQL query to check for potentially unsafe patterns.
    Returns True if the query is safe, False otherwise.
    """
    if not sql_query or not isinstance(sql_query, str):
        return True # An empty query is "safe" as it won't execute

    # Convert to lowercase for case-insensitive matching
    query_lower = sql_query.lower()

    # 1. Block queries that try to reveal schema information
    if 'information_schema' in query_lower or 'pg_catalog' in query_lower:
        return False
        
    # 2. Block overly broad SELECT * queries.
    # We allow 'SELECT *' only if there's a LIMIT clause to restrict the output size.
    if 'select *' in query_lower:
        if 'limit' not in query_lower:
            return False

    # 3. Block data modification statements (as a safeguard)
    disallowed_keywords = ['insert', 'update', 'delete', 'drop', 'alter', 'truncate']
    if any(keyword in query_lower.split() for keyword in disallowed_keywords):
        return False
        
    return True