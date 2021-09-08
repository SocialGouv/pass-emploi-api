import os

from dotenv import load_dotenv
from flask import Flask

app = Flask(__name__)

with app.app_context():
    app.logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))
    load_dotenv(dotenv_path='./.env')
    environment = os.environ.get('ENV')
    IS_DEV = environment == 'development'
    if os.environ.get('SQLALCHEMY_DATABASE_URI') is None:
        app.logger.error('Warning: database URL is not set')
