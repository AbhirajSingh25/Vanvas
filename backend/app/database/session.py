import logging
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger("vanvas.database")

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

def ensure_database_schema(eng=engine):
    """
    Production-safe, additive, dialect-agnostic database migration helper.
    Ensures missing columns and tables exist without dropping or modifying existing data.
    Works transparently on PostgreSQL and SQLite.
    """
    try:
        # Ensure all models are imported so Base.metadata is complete
        try:
            import app.models.models  # noqa: F401
        except Exception:
            pass

        # 1. Create any missing tables defined in models
        Base.metadata.create_all(bind=eng)

        inspector = inspect(eng)
        existing_tables = set(inspector.get_table_names())
        
        with eng.connect() as conn:
            # 2. Check and migrate `users` table
            if "users" in existing_tables:
                user_cols = {col["name"] for col in inspector.get_columns("users")}
                
                if "email_verified_at" not in user_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP NULL"))
                    logger.info("Migrated schema: added email_verified_at to users table.")
                    
                if "avatar_url" not in user_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) NULL"))
                    logger.info("Migrated schema: added avatar_url to users table.")

                if "avatar_storage_key" not in user_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN avatar_storage_key VARCHAR(255) NULL"))
                    logger.info("Migrated schema: added avatar_storage_key to users table.")
                    
                if "role" not in user_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'traveller'"))
                    logger.info("Migrated schema: added role to users table.")

            # 3. Check and migrate `user_preferences` table
            if "user_preferences" in existing_tables:
                pref_cols = {col["name"] for col in inspector.get_columns("user_preferences")}
                pref_additions = {
                    "accommodation_preference": "VARCHAR(100) DEFAULT 'Riverside & Forest Stays'",
                    "transport_preference": "VARCHAR(100) DEFAULT 'Volvo Bus'",
                    "companion_style": "VARCHAR(50) DEFAULT 'Solo'",
                    "language": "VARCHAR(20) DEFAULT 'en'",
                    "region": "VARCHAR(50) DEFAULT 'India'",
                    "currency": "VARCHAR(10) DEFAULT 'INR'",
                    "theme": "VARCHAR(20) DEFAULT 'system'",
                    "location_mode": "VARCHAR(50) DEFAULT 'ask_every_time'",
                    "notify_trip_reminders": "BOOLEAN DEFAULT TRUE",
                    "notify_trip_changes": "BOOLEAN DEFAULT TRUE",
                    "notify_booking_updates": "BOOLEAN DEFAULT TRUE",
                    "notify_suggestions": "BOOLEAN DEFAULT TRUE",
                    "notify_copilot_updates": "BOOLEAN DEFAULT FALSE",
                    "notify_announcements": "BOOLEAN DEFAULT FALSE",
                    "ai_copilot_enabled": "BOOLEAN DEFAULT TRUE",
                    "ai_personalized_recommendations": "BOOLEAN DEFAULT TRUE",
                    "ai_use_travel_preferences": "BOOLEAN DEFAULT TRUE",
                    "ai_use_trip_context": "BOOLEAN DEFAULT TRUE",
                    "created_at": "TIMESTAMP NULL",
                    "updated_at": "TIMESTAMP NULL",
                }
                for col_name, col_def in pref_additions.items():
                    if col_name not in pref_cols:
                        conn.execute(text(f"ALTER TABLE user_preferences ADD COLUMN {col_name} {col_def}"))
                        logger.info(f"Migrated schema: added {col_name} to user_preferences table.")

            # 4. Ensure essential indexes on email_verification_tokens (legacy) and email_verification_otps
            if "email_verification_tokens" in existing_tables:
                try:
                    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_email_verification_tokens_token_hash ON email_verification_tokens(token_hash)"))
                    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_email_verification_tokens_user_id ON email_verification_tokens(user_id)"))
                except Exception:
                    pass

            if "email_verification_otps" in existing_tables:
                try:
                    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_email_verification_otps_otp_hash ON email_verification_otps(otp_hash)"))
                    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_email_verification_otps_user_id ON email_verification_otps(user_id)"))
                except Exception:
                    pass

            conn.commit()
    except Exception as e:
        logger.warning(f"ensure_database_schema encountered an issue: {e}")

# Backward compatibility alias
ensure_sqlite_schema = ensure_database_schema

# Run safe schema migration on module load
try:
    ensure_database_schema(engine)
except Exception:
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

