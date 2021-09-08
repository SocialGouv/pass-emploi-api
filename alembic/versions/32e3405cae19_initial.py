"""initial

Revision ID: 32e3405cae19
Revises: 
Create Date: 2021-09-02 15:23:40.460975

"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy import ForeignKey

# revision identifiers, used by Alembic.
revision = '32e3405cae19'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'conseiller',
        sa.Column('id', sa.BigInteger(), autoincrement=True, primary_key=True),
        sa.Column('first_name', sa.String(255), nullable=False),
        sa.Column('last_name', sa.String(255), nullable=False),
    )

    op.create_table(
        'jeune',
        sa.Column('id', sa.String(255), primary_key=True),
        sa.Column('first_name', sa.String(255), nullable=False),
        sa.Column('last_name', sa.String(255), nullable=False),
        sa.Column('conseiller_id', sa.BigInteger(), ForeignKey('conseiller.id')),
    )

    op.create_table(
        'action',
        sa.Column('id', sa.BigInteger(), autoincrement=True, primary_key=True),
        sa.Column('content', sa.String(1024), nullable=False),
        sa.Column('comment', sa.String(2048), nullable=True),
        sa.Column('is_done', sa.BOOLEAN, nullable=False),
        sa.Column('creation_date', sa.TIMESTAMP, nullable=False),
        sa.Column('last_update', sa.TIMESTAMP, nullable=False),
        sa.Column('jeune_id', sa.String(255), ForeignKey('jeune.id')),
    )

    op.create_table(
        'rendezvous',
        sa.Column('id', sa.BigInteger(), autoincrement=True, primary_key=True),
        sa.Column('title', sa.String(512), nullable=False),
        sa.Column('subtitle', sa.String(512), nullable=True),
        sa.Column('comment', sa.String(2048), nullable=True),
        sa.Column('modality', sa.String(2048), nullable=True),
        sa.Column('date', sa.TIMESTAMP, nullable=False),
        sa.Column('duration', sa.Interval, nullable=False),
        sa.Column('jeune_id', sa.String(255), ForeignKey('jeune.id')),
        sa.Column('conseiller_id', sa.BigInteger(), ForeignKey('conseiller.id')),
    )


def downgrade():
    op.drop_table('conseiller')
    op.drop_table('jeune')
    op.drop_table('action')
    op.drop_table('rendezvous')
