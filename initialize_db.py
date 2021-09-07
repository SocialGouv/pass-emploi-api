import os

from alembic.config import Config
from flask_sqlalchemy import SQLAlchemy

from alembic import command
from initialize_app import app

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('SQLALCHEMY_DATABASE_URI')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)


def run_migrations() -> None:
    alembic_cfg = Config('alembic.ini')
    alembic_cfg.set_main_option("sqlalchemy.url", app.config['SQLALCHEMY_DATABASE_URI'])
    command.upgrade(alembic_cfg, 'head')
