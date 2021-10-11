"""add_creation_date_in_jeune

Revision ID: a3b86ad917c8
Revises: 0ed9b35c6778
Create Date: 2021-10-05 16:54:48.815534

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a3b86ad917c8'
down_revision = '0ed9b35c6778'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('jeune', sa.Column('creation_date', sa.TIMESTAMP, nullable=True))


def downgrade():
    op.drop_column('jeune', 'creation_date')
