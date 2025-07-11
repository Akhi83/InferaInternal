import os
import json
from sqlalchemy import create_engine
from app import db
from app.models.database_connection import DatabaseConnection
from app.utils.nl2sql_utils import get_openai_response, execute_query, get_db_schema
from app.utils.nl2sql_utils import create_visualization


# Test input
data = {
    "prompt": "Summarize The Database",
    "database_string": "mysql+pymysql://user:root@127.42.37.26:3306/sample_db"
}

def handle_llm_query(data):
    prompt = data.get("prompt")
    database_string = data.get("database_string")


    try:
        engine = create_engine(database_string)
    except Exception as e:
        print(f"❌ Error: Failed to connect to database: {str(e)}")
        return

    try:
        schema = get_db_schema(engine)
    except Exception as e:
        print(f"❌ Error: Failed to load schema: {str(e)}")
        return

    print(schema)
    print(f"\n\n")

    llm_response, error = get_openai_response(prompt, schema, api_key=os.getenv("OPENAI_API_KEY"))
    if error:
        print(f"❌ Error: LLM response error: {error}")
        return

    print("✅ Generated SQL:", llm_response["sql_query"])

    df, err = execute_query(llm_response["sql_query"], engine)
    if err:
        print(f"❌ Error executing query: {err}")
        return
    else:
        visualization = create_visualization(df, llm_response)
        if visualization:
            print("✅ Generated Visualization:")
            # visualization.show()

    response = {
        "query": llm_response["sql_query"],
        "explanation": llm_response["explanation"],
        "results": df.to_dict(orient="records"),
        "visualization": {
            "type": llm_response["visualization"],
            "x_axis": llm_response["x_axis"],
            "y_axis": llm_response["y_axis"],
            "color": llm_response.get("color"),
            "title": llm_response["title"],
            "why": llm_response["visualization_explanation"]
        },
        #  "visualization_figure": visualization.to_json() if visualization else None  # 🔥 Important line
    }

    print("✅ Final response:")
    print(json.dumps(response, indent=2))

# Run it
handle_llm_query(data)
