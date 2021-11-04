import os
from functools import wraps

import pytest
from alembic import command
from alembic.config import Config

from config import API_ROOT_PATH
from initialize_app import app
from initialize_db import db
from initialize_routes import initialize_routes


@pytest.fixture(scope='session')
def client():
    with app.app_context():
        app.config['TESTING'] = True
        database_test_uri = os.environ.get('SQLALCHEMY_DATABASE_TEST_URI')
        app.config['SQLALCHEMY_DATABASE_URI'] = database_test_uri

        db.init_app(app)
        run_migrations(database_test_uri)
        initialize_routes(app)

        with app.test_client() as client:
            yield client


def clean_database(f: object) -> object:
    @wraps(f)
    def decorated_function(*args, **kwargs):
        db.session.remove()
        db.drop_all()
        db.create_all()
        return f(*args, **kwargs)
    return decorated_function


def run_migrations(database_test_uri: str) -> None:
    alembic_cfg = Config(f'{API_ROOT_PATH}/alembic.ini')
    alembic_cfg.attributes['sqlalchemy.url'] = database_test_uri
    command.upgrade(alembic_cfg, 'head')
