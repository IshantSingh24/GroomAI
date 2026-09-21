from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

if not settings.DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

# NeonDB pooled URLs already include ?sslmode=require&channel_binding=require
# in the connection string — SQLAlchemy/psycopg2 handles those fine as URL params.
# Do NOT also pass them in connect_args or psycopg2 will error.
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
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
    """Create all tables on startup."""
    import logging
    from app.db.models import Base
    try:
        Base.metadata.create_all(bind=engine)
        logging.info("✅ Database tables ready.")
    except Exception as e:
        # Re-raise so Cloud Run startup logs show the real error
        logging.error(f"❌ init_db failed: {e}")
        raise
