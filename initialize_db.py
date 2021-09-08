import os

from alembic.config import Config
from flask_sqlalchemy import SQLAlchemy

from alembic import command
from initialize_app import app

# SQLAlchemy does not support 'postgres', which is used by some cloud providers
database_uri = os.environ.get('SQLALCHEMY_DATABASE_URI', '').replace('postgres://', 'postgresql://')
app.config['SQLALCHEMY_DATABASE_URI'] = database_uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)


def run_migrations() -> None:
    alembic_cfg = Config('alembic.ini')
    alembic_cfg.set_main_option("sqlalchemy.url", database_uri)
    command.upgrade(alembic_cfg, 'head')
