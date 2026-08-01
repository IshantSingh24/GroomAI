from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

if not settings.DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables. Called once at app startup. Non-fatal if DB is unreachable."""
    import logging
    from app.db.models import Base
    try:
        Base.metadata.create_all(bind=engine)
        logging.info("Database tables ready.")
    except Exception as e:
        logging.warning(f"Could not run create_all at startup (DB may be unreachable): {e}")

