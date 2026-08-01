from fastapi import Header, HTTPException
from jose import jwt, JWTError
from app.core.config import settings

ALGORITHM = "HS256"


def get_current_user(authorization: str = Header(...)) -> str:
    """
    Validate a Bearer JWT signed with HS256.
    Returns the user's email (used as user_id throughout the app).
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    token = authorization[len("Bearer "):]

    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    email: str | None = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Token missing subject")

    return email
