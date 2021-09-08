"""add fake conseiller

Revision ID: 45a0d6910ae7
Revises: 32e3405cae19
Create Date: 2021-09-02 16:39:19.699387

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '45a0d6910ae7'
down_revision = '32e3405cae19'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("INSERT INTO conseiller (first_name, last_name) VALUES ('Nils', 'Tavernier');")


def downgrade():
    op.execute("DELETE FROM conseiller WHERE id == 1")
