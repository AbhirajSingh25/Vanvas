"""Phase 5: Traveller Memory and Personalization Engine

Revision ID: 0002_phase5_traveller_memory
Revises: 0001_initial_baseline
Create Date: 2026-10-09 18:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0002_phase5_traveller_memory'
down_revision: Union[str, None] = '0001_initial_baseline'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Tables and columns are managed idempotently via Base.metadata.create_all and ensure_database_schema
    pass

def downgrade() -> None:
    pass
