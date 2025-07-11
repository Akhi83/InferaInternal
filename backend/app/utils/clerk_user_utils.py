import requests
import os

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")

def get_clerk_user_email(user_id):
    url = f"https://api.clerk.dev/v1/users/{user_id}"
    headers = {
        "Authorization": f"Bearer {CLERK_SECRET_KEY}"
    }

    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        user_data = response.json()
        return user_data["email_addresses"][0]["email_address"]
    else:
        print("[Clerk API Error]", response.text)
        return None
