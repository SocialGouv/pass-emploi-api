import os

from dotenv import load_dotenv
from flask import Flask

app = Flask(__name__)

with app.app_context():
    load_dotenv(dotenv_path='./.env')
    environment = os.environ.get('ENV')
    IS_DEV = environment == 'development'
    database_url = os.environ.get('SQLALCHEMY_DATABASE_URI')
    print("DATABASE URL: " + database_url)
    if database_url is None:
        app.logger.warning('Database URL: %s', database_url)
