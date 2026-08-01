import os

class Settings:
    OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me-in-production")
    DATABASE_URL: str | None = os.getenv("DATABASE_URL")

settings = Settings()
