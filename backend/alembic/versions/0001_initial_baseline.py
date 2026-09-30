"""Initial canonical baseline

Revision ID: 0001_initial_baseline
Revises: 
Create Date: 2026-09-30 11:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0001_initial_baseline'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Tables are managed idempotently via SQLAlchemy Base.metadata.create_all
    pass

def downgrade() -> None:
    pass
