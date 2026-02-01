import json
import os

BASE_PATH = "memory_store"

def _user_dir(user_id: str):
    return os.path.join(BASE_PATH, user_id)

def _profile_path(user_id: str):
    return os.path.join(_user_dir(user_id), "profile.json")


def load_profile(user_id: str) -> dict:
    path = _profile_path(user_id)
    if not os.path.exists(path):
        return {}
    with open(path, "r") as f:
        return json.load(f)


def save_profile(user_id: str, profile: dict):
    os.makedirs(_user_dir(user_id), exist_ok=True)
    with open(_profile_path(user_id), "w") as f:
        json.dump(profile, f, indent=2)
