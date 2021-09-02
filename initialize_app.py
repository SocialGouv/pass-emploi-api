import os

from alembic import command
from alembic.config import Config
from dotenv import load_dotenv
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

from datasources.action_datasource import ActionDatasource
from datasources.conseiller_database_datasource import ConseillerDatabaseDatasource
from datasources.jeune_database_datasource import JeuneDatabaseDatasource
from datasources.rendezvous_datasource import RendezvousDatasource
from firebase.firebase_chat import FirebaseChat
from repositories.action_repository import ActionRepository
from repositories.conseiller_repository import ConseillerRepository
from repositories.jeune_repository import JeuneRepository
from repositories.rendezvous_repository import RendezvousRepository
from use_cases.action_use_case import ActionUseCase
from use_cases.conseiller_use_case import ConseillerUseCase
from use_cases.home_conseiller_use_case import HomeConseillerUseCase
from use_cases.home_jeune_use_case import HomeJeuneUseCase
from use_cases.jeune_use_case import JeuneUseCase
from use_cases.rendezvous_use_case import RendezvousUseCase

app = Flask(__name__)

with app.app_context():
    load_dotenv(dotenv_path='./.env')
    environment = os.environ.get('ENV')
    IS_DEV = environment == 'development'

    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('SQLALCHEMY_DATABASE_URI')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db = SQLAlchemy(app)

    alembic_cfg = Config('alembic.ini')
    alembic_cfg.set_main_option("sqlalchemy.url", app.config['SQLALCHEMY_DATABASE_URI'])
    command.upgrade(alembic_cfg, 'head')

    firebase_chat = FirebaseChat()

    action_datasource = ActionDatasource()
    jeune_database_datasource = JeuneDatabaseDatasource(db)
    rendezvous_datasource = RendezvousDatasource()
    action_repository = ActionRepository(action_datasource)
    conseiller_database_datasource = ConseillerDatabaseDatasource(db)

    conseiller_repository = ConseillerRepository(conseiller_database_datasource, jeune_database_datasource)
    jeune_repository = JeuneRepository(jeune_database_datasource, conseiller_repository, action_repository,
                                       firebase_chat)
    rendezvous_repository = RendezvousRepository(rendezvous_datasource)
    action_use_case = ActionUseCase(jeune_repository, action_repository)

    conseiller_use_case = ConseillerUseCase(conseiller_repository)
    jeune_use_case = JeuneUseCase(jeune_repository, action_repository, rendezvous_repository)
    rendezvous_use_case = RendezvousUseCase(jeune_repository, rendezvous_repository)
    home_jeune_use_case = HomeJeuneUseCase(jeune_repository, action_repository, rendezvous_repository)
    home_conseiller_use_case = HomeConseillerUseCase(jeune_repository, action_repository)
