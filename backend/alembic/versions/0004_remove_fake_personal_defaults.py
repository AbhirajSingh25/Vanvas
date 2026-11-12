"""Remove fake personal preference and avatar defaults while preserving existing user data

Revision ID: 0004_remove_fake_personal_defaults
Revises: 0003_crew_circles_friends_finance
Create Date: 2026-11-12 13:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
from sqlalchemy import text
from app.database.session import ensure_database_schema

revision: str = '0004_remove_fake_personal_defaults'
down_revision: Union[str, None] = '0003_crew_circles_friends_finance'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Non-destructive migration:
    - Preserves all existing user rows, preferences, and uploaded avatar blobs.
    - Updates PostgreSQL column defaults for new rows so personal preferences
      and avatar_preset start unset rather than silently fabricating defaults.
    """
    bind = op.get_bind()
    ensure_database_schema(bind)

    if bind.dialect.name == "postgresql":
        op.execute(text("ALTER TABLE users ALTER COLUMN avatar_type SET DEFAULT 'none'"))
        op.execute(text("ALTER TABLE users ALTER COLUMN avatar_preset DROP DEFAULT"))

        for col in (
            "preferred_travel_style",
            "wake_up_preference",
            "activity_intensity",
            "dietary_preference",
            "interests",
            "accommodation_preference",
            "transport_preference",
            "companion_style",
        ):
            op.execute(text(f"ALTER TABLE user_preferences ALTER COLUMN {col} DROP DEFAULT"))


def downgrade() -> None:
    """Revert server defaults without modifying existing user data."""
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute(text("ALTER TABLE users ALTER COLUMN avatar_type SET DEFAULT 'preset'"))
        op.execute(text("ALTER TABLE users ALTER COLUMN avatar_preset SET DEFAULT 'himalayan-explorer'"))

        op.execute(text("ALTER TABLE user_preferences ALTER COLUMN preferred_travel_style SET DEFAULT 'Balanced'"))
        op.execute(text("ALTER TABLE user_preferences ALTER COLUMN wake_up_preference SET DEFAULT 'Normal'"))
        op.execute(text("ALTER TABLE user_preferences ALTER COLUMN activity_intensity SET DEFAULT 'Balanced'"))
        op.execute(text("ALTER TABLE user_preferences ALTER COLUMN dietary_preference SET DEFAULT 'All'"))
        op.execute(text("ALTER TABLE user_preferences ALTER COLUMN interests SET DEFAULT 'Nature,Cafés,Adventure,Food'"))
        op.execute(text("ALTER TABLE user_preferences ALTER COLUMN accommodation_preference SET DEFAULT 'Riverside & Forest Stays'"))
        op.execute(text("ALTER TABLE user_preferences ALTER COLUMN transport_preference SET DEFAULT 'Volvo Bus'"))
        op.execute(text("ALTER TABLE user_preferences ALTER COLUMN companion_style SET DEFAULT 'Solo'"))

