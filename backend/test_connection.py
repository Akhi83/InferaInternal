from sqlalchemy import create_engine
from config import Config

# engine = create_engine("postgresql://postgres.wyatvbprwuqknnmmjyxr:glpet5R8g2GafITm@aws-0-ap-south-1.pooler.supabase.com:6543/postgres")
# engine = create_engine("mysql+pymysql://root:root@localhost:3306/testdb") 
engine = create_engine("mysql+pymysql://root:arsars83@localhost:3306/testrschema")
try:
    conn = engine.connect()
    print("✅ Connection successful")
    conn.close()
except Exception as e:
    print("❌ Connection failed:", e)
