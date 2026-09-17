from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Determine database engine arguments & normalize connection URL
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def ensure_sqlite_schema(eng=engine):
    try:
        with eng.connect() as conn:
            result = conn.execute(text("PRAGMA table_info(user_preferences)"))
            existing_cols = {row[1] for row in result.fetchall()}
            if existing_cols:
                if "accommodation_preference" not in existing_cols:
                    conn.execute(text("ALTER TABLE user_preferences ADD COLUMN accommodation_preference VARCHAR(100) DEFAULT 'Riverside & Forest Stays'"))
                if "transport_preference" not in existing_cols:
                    conn.execute(text("ALTER TABLE user_preferences ADD COLUMN transport_preference VARCHAR(100) DEFAULT 'Volvo Bus'"))
            # Ensure trip_invites table exists if missing in SQLite
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS trip_invites (
                    id VARCHAR(36) PRIMARY KEY,
                    trip_id VARCHAR(36) NOT NULL,
                    code VARCHAR(32) NOT NULL UNIQUE,
                    created_at DATETIME,
                    expires_at DATETIME,
                    revoked BOOLEAN DEFAULT 0,
                    FOREIGN KEY(trip_id) REFERENCES trips(id)
                )
            """))
            # Ensure conversations and conversation_messages tables exist if missing in persistent SQLite
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS conversations (
                    id VARCHAR(36) PRIMARY KEY,
                    user_id VARCHAR(36) NOT NULL,
                    trip_id VARCHAR(36),
                    destination_slug VARCHAR(100),
                    title VARCHAR(255) DEFAULT 'Mountain Expedition Session',
                    summary TEXT,
                    context_state TEXT,
                    created_at DATETIME,
                    updated_at DATETIME,
                    FOREIGN KEY(user_id) REFERENCES users(id),
                    FOREIGN KEY(trip_id) REFERENCES trips(id)
                )
            """))
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS conversation_messages (
                    id VARCHAR(36) PRIMARY KEY,
                    conversation_id VARCHAR(36) NOT NULL,
                    role VARCHAR(20) NOT NULL,
                    content TEXT NOT NULL,
                    tool_calls TEXT,
                    tool_results TEXT,
                    metadata_json TEXT,
                    created_at DATETIME,
                    FOREIGN KEY(conversation_id) REFERENCES conversations(id)
                )
            """))
            conn.commit()
    except Exception:
        pass

# Run on module load for persistent SQLite database file
if settings.DATABASE_URL.startswith("sqlite"):
    ensure_sqlite_schema(engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
