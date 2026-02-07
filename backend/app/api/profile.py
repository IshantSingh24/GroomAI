from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.memory.profile import load_profile, save_profile

router = APIRouter(prefix="/profile", tags=["Profile"])


ALLOWED_KEYS = {
    "name",
    "age",
    "gender",
    "skin_type",
    "major_skin_issues",
}


def get_user_id(request: Request) -> str:
    email = request.headers.get("x-clerk-user-email")
    if not email:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return email.strip().lower()


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    skin_type: Optional[str] = None
    major_skin_issues: Optional[str] = None


@router.get("/")
def get_profile_api(request: Request):
    user_id = get_user_id(request)
    return load_profile(user_id)


@router.put("/")
def update_profile_api(
    request: Request,
    payload: ProfileUpdate
):
    user_id = get_user_id(request)
    profile = load_profile(user_id)

    updates = payload.dict(exclude_unset=True)

    for key in updates:
        if key not in ALLOWED_KEYS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid profile field: {key}"
            )

    profile.update(updates)
    save_profile(user_id, profile)

    return {
        "status": "updated",
        "profile": profile
    }
