import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

# Load database URL from environment or fallback to local SQLite database
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///verra.db")

# Adjust SQLite connect arguments for multi-threaded FastAPI usage
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Create engine and sessionmaker
engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def run_db_migrations():
    """Runs all Alembic migrations programmatically on startup, falling back to Metadata creation if needed."""
    try:
        import os
        from alembic.config import Config
        from alembic import command
        
        # Resolve alembic.ini path
        db_dir = os.path.dirname(os.path.abspath(__file__))
        api_dir = os.path.dirname(os.path.dirname(db_dir))
        ini_path = os.path.join(api_dir, "alembic.ini")
        
        alembic_cfg = Config(ini_path)
        alembic_cfg.set_main_option("sqlalchemy.url", DATABASE_URL)
        
        print("Checking/running database migrations via Alembic...")
        command.upgrade(alembic_cfg, "head")
        print("Alembic migrations completed successfully.")
    except Exception as e:
        print(f"Alembic migration warning (falling back to metadata creation): {e}")
        try:
            from app.db.models import Base
            Base.metadata.create_all(bind=engine)
            print("Fallback metadata table creation completed successfully.")
        except Exception as ex:
            print(f"Database initialization failed: {ex}")

def get_db():
    """FastAPI dependency yielding a thread-safe database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
