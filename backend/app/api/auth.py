from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import APIRouter, HTTPException
from jose import jwt
from pydantic import BaseModel

from app.core.config import settings
from app.db.session import SessionLocal
from app.db.models import User

router = APIRouter(prefix="/auth", tags=["Auth"])

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


# ── Schemas ─────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str


# ── Helpers ──────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": email, "exp": expire},
        settings.JWT_SECRET,
        algorithm=ALGORITHM,
    )


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=201)
def register(body: RegisterRequest):
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == body.email.lower()).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

        hashed = hash_password(body.password)
        user = User(email=body.email.lower(), hashed_password=hashed)
        db.add(user)
        db.commit()
    finally:
        db.close()

    token = create_access_token(body.email.lower())
    return TokenResponse(access_token=token, email=body.email.lower())


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == body.email.lower()).first()
    finally:
        db.close()

    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.email)
    return TokenResponse(access_token=token, email=user.email)
