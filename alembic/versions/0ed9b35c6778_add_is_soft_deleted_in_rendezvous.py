"""add_is_soft_deleted_in_rendezvous

Revision ID: 0ed9b35c6778
Revises: 348bc92da308
Create Date: 2021-10-07 11:29:55.721556

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
from sqlalchemy.sql import expression

revision = '0ed9b35c6778'
down_revision = '348bc92da308'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('rendezvous', sa.Column('is_soft_deleted', sa.Boolean, server_default=expression.false()))


def downgrade():
    op.drop_column('rendezvous', 'is_soft_deleted')
