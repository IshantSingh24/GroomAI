import os

class Settings:
    OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY")
    CLERK_JWKS_URL: str | None = os.getenv("CLERK_JWKS_URL")
    DATABASE_URL: str | None = os.getenv("DATABASE_URL")

settings = Settings()
