import logging
import os

from dotenv import load_dotenv
from flask import Flask

app = Flask(__name__)


def set_log_level() -> None:
    app.logger.setLevel(logging.DEBUG)
    # log_level = os.environ.get('LOG_LEVEL')


with app.app_context():
    set_log_level()
    load_dotenv(dotenv_path='./.env')
    environment = os.environ.get('ENV')
    IS_DEV = environment == 'development'
    if os.environ.get('SQLALCHEMY_DATABASE_URI') is None:
        app.logger.error('Warning: database URL is not set')
