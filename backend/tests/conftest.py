"""
VANVAS Test Suite Configuration & Fixtures.
Ensures deterministic database initialization, clean seed state, and strict fixture isolation.
"""

import os
import pytest
from app.database.session import engine, ensure_database_schema, SessionLocal
from app.seed.seed_data import seed_database
from app.main import app
from app.database.session import get_db

@pytest.fixture(scope="session", autouse=True)
def setup_test_suite_database():
    """
    Session-wide database fixture ensuring all required canonical tables and data
    are present deterministically across all environments (local & CI).
    """
    ensure_database_schema(engine)
    db = SessionLocal()
    try:
        seed_database(engine_to_use=engine, db=db)
    finally:
        db.close()


@pytest.fixture(autouse=True)
def clean_dependency_overrides():
    """
    Ensures that any dependency override set by a test is cleaned up
    and does not leak to subsequent test modules.
    """
    yield
    app.dependency_overrides.clear()
