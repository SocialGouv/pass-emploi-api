"""fill_action_creator_id_for_passed_actions_without_creator

Revision ID: e749d6457d21
Revises: 995f2e46f711
Create Date: 2021-10-20 19:34:13.245072

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e749d6457d21'
down_revision = '995f2e46f711'
branch_labels = None
depends_on = None


def upgrade():
    op.execute('''
    BEGIN TRANSACTION;
    INSERT INTO action_creator ("creator_id", "action_creator_type") (SELECT id, 'conseiller' FROM conseiller);
    
    UPDATE action SET action_creator_id = a.id  FROM action_creator a, jeune b WHERE CAST(a.creator_id AS bigint) = b.conseiller_id AND action_creator_id IS NULL;
    COMMIT;
    ''')


def downgrade():
    pass
