import os

from dotenv import load_dotenv
from flask import Flask

app = Flask(__name__)

with app.app_context():
    load_dotenv(dotenv_path='./.env')
    environment = os.environ.get('ENV')
    IS_DEV = environment == 'development'
