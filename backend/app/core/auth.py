import os
import requests
from fastapi import Header, HTTPException
from jose import jwt

def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")

    token = authorization.replace("Bearer ", "")

    issuer = os.getenv("CLERK_ISSUER")
    if not issuer:
        raise HTTPException(status_code=500, detail="CLERK_ISSUER not set")

    jwks = requests.get(f"{issuer}/.well-known/jwks.json").json()

    try:
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            audience="clerk",
            issuer=issuer,
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    return payload["sub"]
