"""add_new_fields_in_action

Revision ID: 995f2e46f711
Revises: a7cf2cb41c8d
Create Date: 2021-10-18 12:53:21.829910

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
from sqlalchemy import ForeignKey
from sqlalchemy.dialects import postgresql
from sqlalchemy.sql import expression

revision = '995f2e46f711'
down_revision = 'a7cf2cb41c8d'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('action', sa.Column('is_visible_by_conseiller', sa.BOOLEAN, nullable=False,
                                      server_default=expression.true()))
    op.add_column('action', sa.Column('limit_date', sa.TIMESTAMP, nullable=True))
    op.add_column('action', sa.Column('action_creator_id', sa.BigInteger(), ForeignKey('action_creator.id')))

    status = postgresql.ENUM('NOT_STARTED', 'IN_PROGRESS', 'DONE', name='status')
    status.create(op.get_bind())
    op.add_column('action', sa.Column('status', sa.Enum('NOT_STARTED', 'IN_PROGRESS', 'DONE', name='status'),
                                      nullable=False, server_default='NOT_STARTED'))


def downgrade():
    op.drop_column('action', 'is_visible_by_conseiller')
    op.drop_column('action', 'limit_date')
    op.drop_column('action', 'action_creator_id')
    op.drop_column('action', 'status')
    status = postgresql.ENUM('NOT_STARTED', 'IN_PROGRESS', 'DONE', name='status')
    status.drop(op.get_bind())
