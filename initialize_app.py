import os

from dotenv import load_dotenv
from flask import Flask

from datasources.action_datasource import ActionDatasource
from datasources.jeune_datasource import JeuneDatasource
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

    firebase_chat = FirebaseChat()

    action_datasource = ActionDatasource()
    jeune_datasource = JeuneDatasource()
    rendezvous_datasource = RendezvousDatasource()
    action_repository = ActionRepository(action_datasource)

    jeune_repository = JeuneRepository(jeune_datasource, action_repository, firebase_chat)
    rendezvous_repository = RendezvousRepository(rendezvous_datasource)
    action_use_case = ActionUseCase(jeune_repository, action_repository)
    conseiller_repository = ConseillerRepository(jeune_datasource)

    conseiller_use_case = ConseillerUseCase(conseiller_repository)
    jeune_use_case = JeuneUseCase(jeune_repository, action_repository, rendezvous_repository)
    rendezvous_use_case = RendezvousUseCase(jeune_repository, rendezvous_repository)
    home_jeune_use_case = HomeJeuneUseCase(jeune_repository, action_repository, rendezvous_repository)
    home_conseiller_use_case = HomeConseillerUseCase(jeune_repository, action_repository)
