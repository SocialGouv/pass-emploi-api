import os

from alembic.config import Config
from flask_sqlalchemy import SQLAlchemy

from alembic import command
from initialize_app import app

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('SQLALCHEMY_DATABASE_URI')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)


def run_migrations() -> None:
    alembic_file_exists = os.path.isfile('alembic.ini')
    alembic_folder_exists = os.path.isfile('alembic/versions/32e3405cae19_initial.py')
    app.logger.info('alembic.ini exists ? %s', alembic_file_exists)
    app.logger.info('alembic folder exists ? %s', alembic_folder_exists)
    alembic_cfg = Config('alembic.ini')
    alembic_cfg.set_main_option("sqlalchemy.url", app.config['SQLALCHEMY_DATABASE_URI'])
    command.upgrade(alembic_cfg, 'head')
