"""Crew Circles, Friends Identity, Split Pods and Collaborative Finance

Revision ID: 0003_crew_circles_friends_finance
Revises: 0002_phase5_traveller_memory
Create Date: 2026-11-11 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
from app.database.session import ensure_database_schema

revision: str = '0003_crew_circles_friends_finance'
down_revision: Union[str, None] = '0002_phase5_traveller_memory'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Tables, columns and indexes are created and backfilled idempotently via ensure_database_schema
    bind = op.get_bind()
    ensure_database_schema(bind)

def downgrade() -> None:
    pass

