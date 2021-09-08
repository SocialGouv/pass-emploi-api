import logging
import os

from dotenv import load_dotenv
from flask import Flask

app = Flask(__name__)


def set_log_level() -> None:
    app.logger.setLevel(logging.DEBUG)
    # log_level = os.environ.get('LOG_LEVEL')
    # dictConfig(
    #     {
    #         'version': 1,
    #         'root': {'level': 'INFO' if log_level is None else log_level}
    #     }
    # )
    # del app.logger.handlers[:]
    # handler = logging.StreamHandler(stream=sys.stdout)
    # handler.setLevel(logging.DEBUG)
    # handler.formatter = logging.Formatter(
    #     fmt=u"%(asctime)s level=%(levelname)s %(message)s",
    #     datefmt="%Y-%m-%dT%H:%M:%SZ",
    # )
    # app.logger.addHandler(handler)


with app.app_context():
    set_log_level()
    load_dotenv(dotenv_path='./.env')
    environment = os.environ.get('ENV')
    IS_DEV = environment == 'development'
    if os.environ.get('SQLALCHEMY_DATABASE_URI') is None:
        app.logger.error('Warning: database URL is not set')
