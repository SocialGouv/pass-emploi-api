"""add_token_and_last_update_in_jeune

Revision ID: 348bc92da308
Revises: 32e3405cae19
Create Date: 2021-10-01 16:08:30.683735

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '348bc92da308'
down_revision = '32e3405cae19'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('jeune', sa.Column('firebase_token', sa.String(255), nullable=True))
    op.add_column('jeune', sa.Column('token_last_update', sa.TIMESTAMP, nullable=True))


def downgrade():
    op.drop_column('jeune', 'firebase_token')
    op.drop_column('jeune', 'token_last_update')
