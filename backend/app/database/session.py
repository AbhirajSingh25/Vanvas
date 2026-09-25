import logging
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.exc import OperationalError, ProgrammingError
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger("vanvas.database")


def normalize_database_url(raw_url: str) -> str:
    """
    Safely normalize database connection URLs across production (PostgreSQL on Render/Neon)
    and local development (SQLite).

    Ensures PostgreSQL URLs explicitly use the installed psycopg2 driver:
      - postgres:// -> postgresql+psycopg2://
      - postgresql:// -> postgresql+psycopg2://
      - postgresql+psycopg:// -> postgresql+psycopg2://
      - postgresql+psycopg2:// -> postgresql+psycopg2://

    Preserves SQLite URLs, query parameters, credentials, and hostnames without corruption.
    """
    if not raw_url:
        return "sqlite:///./vanvas.db"

    url_str = raw_url.strip()

    if url_str.startswith("postgres://"):
        return "postgresql+psycopg2://" + url_str[len("postgres://"):]
    elif url_str.startswith("postgresql+psycopg://"):
        return "postgresql+psycopg2://" + url_str[len("postgresql+psycopg://"):]
    elif url_str.startswith("postgresql://"):
        return "postgresql+psycopg2://" + url_str[len("postgresql://"):]

    return url_str


# Build sanitized, normalized database engine
db_url = normalize_database_url(settings.DATABASE_URL)

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Build engine with pool_pre_ping for resilient cloud connection management
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
    Works transparently on PostgreSQL (Render/Neon) and SQLite.

    Distinguishes clearly between connection failures, schema creation errors,
    and column migration warnings without exposing credentials.
    """
    # 1. Ensure models are registered on Base.metadata
    try:
        import app.models.models  # noqa: F401
    except Exception as e:
        logger.warning(f"Model registration during schema check: {e}")

    # 2. Test database connectivity and create missing tables
    try:
        Base.metadata.create_all(bind=eng)
    except OperationalError as oe:
        logger.error(f"Database connection failure during schema check: {oe.orig if hasattr(oe, 'orig') else oe}")
        return False
    except Exception as e:
        logger.error(f"Schema creation failure during table initialization: {e}")
        return False

    # 3. Perform non-destructive column migrations
    try:
        inspector = inspect(eng)
        existing_tables = set(inspector.get_table_names())

        with eng.connect() as conn:
            # Check and migrate `destinations` table
            if "destinations" in existing_tables:
                dest_cols = {col["name"] for col in inspector.get_columns("destinations")}
                if "hindi_name" not in dest_cols:
                    conn.execute(text("ALTER TABLE destinations ADD COLUMN hindi_name VARCHAR(255) NULL"))
                    logger.info("Migrated schema: added hindi_name to destinations table.")

            # Check and migrate `users` table
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

            # Check and migrate `user_preferences` table
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

            # Ensure essential indexes on email verification tables
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
        return True
    except OperationalError as oe:
        logger.error(f"Database connection error during migration check: {oe.orig if hasattr(oe, 'orig') else oe}")
        return False
    except Exception as e:
        logger.warning(f"Migration verification encountered an issue: {e}")
        return False


# Backward compatibility alias
ensure_sqlite_schema = ensure_database_schema


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
