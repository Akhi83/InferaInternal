import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def ensure_user_in_supabase(user_id, email):
    try:
        response = supabase.table("User").select("user_id").eq("user_id", user_id).execute()
        if response.data:
            return  # Already exists
        print(f"Email found is {email}")
        supabase.table("User").insert({
            "user_id": user_id,
            "email_id": email,
           
        }).execute()
    except Exception as e:
        print(f"[Supabase Error] {e}")
        raise
