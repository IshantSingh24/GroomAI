from agents import function_tool
from app.memory.profile import load_profile, save_profile


@function_tool
def get_profile(user_id: str) -> dict:
    return load_profile(user_id)


@function_tool
def update_profile(user_id: str, key: str, value: str):
    profile = load_profile(user_id)
    profile[key] = value
    save_profile(user_id, profile)
    return "profile updated"
