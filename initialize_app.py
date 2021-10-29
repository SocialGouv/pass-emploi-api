import os

from dotenv import load_dotenv
from flask import Flask

app = Flask(__name__)

with app.app_context():
    app.logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))
    app.logger.propagate = False
    load_dotenv(dotenv_path='./.env')
    DEBUG = (os.getenv('DEBUG', 'False') == 'True')
    if os.environ.get('SQLALCHEMY_DATABASE_URI') is None:
        app.logger.error('Warning: database URL is not set')
