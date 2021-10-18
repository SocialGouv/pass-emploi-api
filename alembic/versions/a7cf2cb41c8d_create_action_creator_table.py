"""create_action_creator_table

Revision ID: a7cf2cb41c8d
Revises: a3b86ad917c8
Create Date: 2021-10-18 12:48:54.787827

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
from sqlalchemy.dialects import postgresql

revision = 'a7cf2cb41c8d'
down_revision = 'a3b86ad917c8'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'action_creator',
        sa.Column('id', sa.String(255), primary_key=True),
        sa.Column('creator_id', sa.String(255), nullable=False),
    )

    action_creator_type = postgresql.ENUM('jeune', 'conseiller', name='action_creator_type')
    action_creator_type.create(op.get_bind())
    op.add_column('action_creator', sa.Column('action_creator_type', sa.Enum('jeune', 'conseiller',
                                                                         name='action_creator_type'), nullable=False))


def downgrade():
    op.drop_table('action_creator')
    op.drop_column('action_creator', 'action_creator_type')
    action_creator_type = postgresql.ENUM('jeune', 'conseiller', name='action_creator_type')
    action_creator_type.drop(op.get_bind())
