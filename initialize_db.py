import os

from alembic.config import Config
from flask_sqlalchemy import SQLAlchemy

from alembic import command
from initialize_app import app

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('SQLALCHEMY_DATABASE_URI')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.logger.warn('>>> Initialize SQLAlchemy db...')
db = SQLAlchemy(app)
app.logger.warn('>>> Initialize SQLAlchemy done')


def run_migrations() -> None:
    app.logger.warn('>>>>>> Inside run_migrations...')
    alembic_cfg = Config('alembic.ini')
    app.logger.warn('>>>>>> After alembic_cfg = Config(alembic.ini)')
    alembic_cfg.set_main_option("sqlalchemy.url", app.config['SQLALCHEMY_DATABASE_URI'])
    app.logger.warn('>>>>>> After set_main_option')
    try:
        command.upgrade(alembic_cfg, 'head')
        app.logger.warn('>>>>>> After command.upgrade')
    except:
        app.logger.error('>>>>>> command.upgrade done')
    app.logger.warn('>>>>>> Inside run_migrations done')
