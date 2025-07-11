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
def get_openai_response(question, schema_info, api_key=None):
    api_key = api_key or os.getenv("OPENAI_API_KEY")

    if not api_key:
        return get_sample_llm_response(question), None

    agent_prompt = f"""You are an expert in SQL and data analysis. Based on the database schema below, generate a SQL query to answer the user's question.

DATABASE SCHEMA:
{json.dumps(schema_info, indent=2)}
USER QUESTION: {question}
Provide your response in the following JSON format:
{{
    "explanation": "Brief explanation of how you'll solve this",
    "sql_query": "A single SQL query (do not return multiple statements). If needed, use JOINs or UNIONs.",
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
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a SQL and data visualization expert."},
                {"role": "user", "content": agent_prompt}
            ],
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
































def get_sample_llm_response(question):
    samples = [
        {
            "explanation": "Fetching top 5 products by total sales from the `orders` table.",
            "sql_query": "SELECT product_name, SUM(amount) AS total_sales FROM orders GROUP BY product_name ORDER BY total_sales DESC LIMIT 5;",
            "visualization": "bar",
            "visualization_explanation": "A bar chart clearly shows the top 5 products by sales.",
            "x_axis": "product_name",
            "y_axis": "total_sales",
            "title": "Top 5 Products by Sales",
            "color": None,
            "source": "sample"
        },
        {
            "explanation": "Summarizing monthly revenue using the `invoices` table.",
            "sql_query": "SELECT strftime('%Y-%m', invoice_date) AS month, SUM(total) AS revenue FROM invoices GROUP BY month;",
            "visualization": "line",
            "visualization_explanation": "Line chart helps visualize revenue trends over time.",
            "x_axis": "month",
            "y_axis": "revenue",
            "title": "Monthly Revenue Trend",
            "color": None,
            "source": "sample"
        },
        {
            "explanation": "Calculating average session time per user.",
            "sql_query": "SELECT user_id, AVG(session_duration) AS avg_duration FROM sessions GROUP BY user_id;",
            "visualization": "scatter",
            "visualization_explanation": "Scatter plot shows variation in user session durations.",
            "x_axis": "user_id",
            "y_axis": "avg_duration",
            "title": "User Session Duration",
            "color": None,
            "source": "sample"
        },
        {
            "explanation": "Showing order count by status from the `orders` table.",
            "sql_query": "SELECT status, COUNT(*) AS order_count FROM orders GROUP BY status;",
            "visualization": "pie",
            "visualization_explanation": "Pie chart shows proportion of order statuses.",
            "x_axis": "status",
            "y_axis": "order_count",
            "title": "Order Status Distribution",
            "color": None,
            "source": "sample"
        },
        {
            "explanation": "Finding top 3 performing employees by number of sales.",
            "sql_query": "SELECT employee_id, COUNT(*) AS num_sales FROM sales GROUP BY employee_id ORDER BY num_sales DESC LIMIT 3;",
            "visualization": "bar",
            "visualization_explanation": "Bar chart highlights top performers.",
            "x_axis": "employee_id",
            "y_axis": "num_sales",
            "title": "Top Employees by Sales",
            "color": None,
            "source": "sample"
        },
        {
            "explanation": "Daily traffic analysis from `web_logs` table.",
            "sql_query": "SELECT DATE(access_time) AS day, COUNT(*) AS hits FROM web_logs GROUP BY day ORDER BY day;",
            "visualization": "line",
            "visualization_explanation": "Line chart illustrates daily traffic pattern.",
            "x_axis": "day",
            "y_axis": "hits",
            "title": "Website Daily Traffic",
            "color": None,
            "source": "sample"
        },
        {
            "explanation": "Visualizing expense breakdown by category.",
            "sql_query": "SELECT category, SUM(amount) AS total_spent FROM expenses GROUP BY category;",
            "visualization": "pie",
            "visualization_explanation": "Pie chart shows how expenses are distributed.",
            "x_axis": "category",
            "y_axis": "total_spent",
            "title": "Expense Breakdown",
            "color": None,
            "source": "sample"
        },
        {
            "explanation": "Checking average rating per product.",
            "sql_query": "SELECT product_id, AVG(rating) AS avg_rating FROM reviews GROUP BY product_id;",
            "visualization": "bar",
            "visualization_explanation": "Bar chart makes it easy to compare ratings.",
            "x_axis": "product_id",
            "y_axis": "avg_rating",
            "title": "Product Ratings",
            "color": None,
            "source": "sample"
        },
        {
            "explanation": "Show user count by signup month.",
            "sql_query": "SELECT strftime('%Y-%m', signup_date) AS month, COUNT(*) AS user_count FROM users GROUP BY month;",
            "visualization": "line",
            "visualization_explanation": "Line chart shows user acquisition over time.",
            "x_axis": "month",
            "y_axis": "user_count",
            "title": "Monthly User Signups",
            "color": None,
            "source": "sample"
        },
        {
            "explanation": "Compare sales by region.",
            "sql_query": "SELECT region, SUM(amount) AS sales FROM sales_data GROUP BY region;",
            "visualization": "bar",
            "visualization_explanation": "Bar chart compares total sales across regions.",
            "x_axis": "region",
            "y_axis": "sales",
            "title": "Regional Sales Comparison",
            "color": None,
            "source": "sample"
        },
    ]

    return random.choice(samples)
