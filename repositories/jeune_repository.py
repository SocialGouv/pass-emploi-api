import random

from datasources.jeune_database_datasource import JeuneDatabaseDatasource
from firebase.firebase_chat import FirebaseChat
from model.jeune import Jeune
from repositories.action_repository import ActionRepository
from repositories.conseiller_repository import ConseillerRepository
from sql_model.sql_jeune import SqlJeune
from transformers.jeune_transformer import to_jeune
from use_cases.create_jeune_request import CreateJeuneRequest

first_names = ('Kenji', 'Kevin', 'Léa', 'Marie', 'Lucie', 'Jean', 'Michel')
last_names = ('DeBruyne', 'Dupont', 'Curie', 'Seydoux', 'Durand', 'Petit')


class JeuneRepository:

    def __init__(
            self,
            jeune_datasource: JeuneDatabaseDatasource,
            conseiller_repository: ConseillerRepository,
            action_repository: ActionRepository,
            firebase_chat: FirebaseChat
    ):
        self.jeuneDatasource = jeune_datasource
        self.conseillerRepository = conseiller_repository
        self.actionRepository = action_repository
        self.firebaseChat = firebase_chat

    def create_mocked_jeune(self, jeune_id: str) -> None:
        if not self.jeuneDatasource.exists(jeune_id):
            conseiller = self.conseillerRepository.get_random_conseiller()
            sql_jeune = SqlJeune(
                id=jeune_id,
                firstName=random.choice(first_names),
                lastName=random.choice(last_names),
                conseillerId=conseiller.id
            )
            self.jeuneDatasource.create_jeune(sql_jeune)

    def get_jeune(self, jeune_id: str) -> Jeune:
        sql_jeune = self.jeuneDatasource.get(jeune_id)
        return to_jeune(sql_jeune) if sql_jeune is not None else None

    def initialise_chat_if_required(self, jeune_id: str):
        sql_jeune = self.jeuneDatasource.get(jeune_id)
        self.firebaseChat.initialise_chat_if_required(sql_jeune.id, sql_jeune.conseillerId)

    def create_jeune(self, request: CreateJeuneRequest) -> Jeune:
        conseiller = self.conseillerRepository.get_random_conseiller()
        sql_jeune = SqlJeune(
            id=request.id,
            firstName=request.firstName,
            lastName=request.lastName,
            conseillerId=conseiller.id
        )
        self.firebaseChat.initialise_chat_if_required(sql_jeune.id, conseiller.id)
        self.jeuneDatasource.create_jeune(sql_jeune)
        return Jeune(request.id, request.firstName, request.lastName, conseiller)
