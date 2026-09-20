import pytest
from datetime import datetime, timezone
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.database.session import Base, ensure_database_schema
from app.models.models import User, EmailVerificationToken, UserPreference
from app.core.security import get_password_hash

def test_fresh_database_schema_creation():
    """Ensure a fresh database initializes all tables and columns including email verification."""
    test_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    ensure_database_schema(test_engine)

    inspector = inspect(test_engine)
    tables = set(inspector.get_table_names())

    assert "users" in tables
    assert "email_verification_tokens" in tables
    assert "user_preferences" in tables

    user_cols = {c["name"] for c in inspector.get_columns("users")}
    assert "email_verified_at" in user_cols
    assert "email" in user_cols
    assert "hashed_password" in user_cols

    token_cols = {c["name"] for c in inspector.get_columns("email_verification_tokens")}
    assert "token_hash" in token_cols
    assert "expires_at" in token_cols
    assert "used_at" in token_cols
    assert "user_id" in token_cols

def test_legacy_database_migration_preserves_data():
    """Ensure an existing legacy database lacking email_verified_at is upgraded safely preserving users."""
    test_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )

    # 1. Create a legacy `users` table without email_verified_at
    with test_engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE users (
                id VARCHAR(36) PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                hashed_password VARCHAR(255) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'traveller',
                created_at DATETIME
            )
        """))
        # Insert legacy existing user
        conn.execute(text("""
            INSERT INTO users (id, email, hashed_password, full_name, role)
            VALUES ('u1-legacy-uuid', 'legacy.traveler@example.com', 'hashed_pass_secret', 'Legacy Traveler', 'traveller')
        """))
        conn.commit()

    # Verify column is missing initially
    inspector_before = inspect(test_engine)
    cols_before = {c["name"] for c in inspector_before.get_columns("users")}
    assert "email_verified_at" not in cols_before

    # 2. Run migration
    ensure_database_schema(test_engine)

    # 3. Verify column is added and existing user is intact
    inspector_after = inspect(test_engine)
    cols_after = {c["name"] for c in inspector_after.get_columns("users")}
    assert "email_verified_at" in cols_after

    Session = sessionmaker(bind=test_engine)
    db = Session()
    legacy_user = db.query(User).filter(User.email == "legacy.traveler@example.com").first()
    assert legacy_user is not None
    assert legacy_user.id == "u1-legacy-uuid"
    assert legacy_user.full_name == "Legacy Traveler"
    assert legacy_user.email_verified_at is None
    db.close()

def test_migration_is_idempotent():
    """Ensure running ensure_database_schema repeatedly causes no errors or duplicate columns."""
    test_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )

    # Run multiple times
    ensure_database_schema(test_engine)
    ensure_database_schema(test_engine)
    ensure_database_schema(test_engine)

    inspector = inspect(test_engine)
    user_cols = [c["name"] for c in inspector.get_columns("users")]
    # Count occurrences of email_verified_at
    assert user_cols.count("email_verified_at") == 1

def test_token_creation_and_user_query_on_migrated_schema():
    """Ensure EmailVerificationToken and User operations work seamlessly on a migrated database."""
    test_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    ensure_database_schema(test_engine)

    Session = sessionmaker(bind=test_engine)
    db = Session()

    user = User(
        email="migration.test@example.com",
        hashed_password=get_password_hash("pass1234"),
        full_name="Migration Test User",
        email_verified_at=None
    )
    db.add(user)
    db.flush()

    token_record = EmailVerificationToken(
        user_id=user.id,
        token_hash="sha256_dummy_hash_for_testing_purposes_only_1234567890abcdef",
        expires_at=datetime.now(timezone.utc)
    )
    db.add(token_record)
    db.commit()

    # Query back
    fetched_user = db.query(User).filter(User.email == "migration.test@example.com").first()
    assert fetched_user is not None
    assert fetched_user.email_verified_at is None
    assert len(fetched_user.verification_tokens) == 1
    assert fetched_user.verification_tokens[0].token_hash == "sha256_dummy_hash_for_testing_purposes_only_1234567890abcdef"
    db.close()
