from sqlalchemy import create_engine, inspect

engine = create_engine("mysql+pymysql://root:arsars83@localhost:3306/demo")

inspector = inspect(engine)
print(inspector.get_table_names())
schema = get_db_schema(engine)
print(json.dumps(schema, indent=2))  # full structure
