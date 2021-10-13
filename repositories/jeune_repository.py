from datetime import datetime

from datasources.jeune_database_datasource import JeuneDatabaseDatasource
from firebase.firebase_chat import FirebaseChat
from model.jeune import Jeune
from sql_model.sql_jeune import SqlJeune
from transformers.jeune_transformer import to_jeune
from use_cases.create_jeune_request import CreateJeuneRequest
from utils.id_generator import id_generator


class JeuneRepository:

    def __init__(self, jeune_datasource: JeuneDatabaseDatasource, firebase_chat: FirebaseChat):
        self.jeuneDatasource = jeune_datasource
        self.firebaseChat = firebase_chat

    def get_jeune(self, jeune_id: str) -> Jeune:
        sql_jeune = self.jeuneDatasource.get(jeune_id)
        return to_jeune(sql_jeune) if sql_jeune is not None else None

    def initialise_chat_if_required(self, jeune_id: str):
        sql_jeune = self.jeuneDatasource.get(jeune_id)
        self.firebaseChat.initialise_chat_if_required(sql_jeune.id, sql_jeune.conseillerId)

    def update_firebase_notification_informations(self, jeune_id: str, registration_token: str):
        self.jeuneDatasource.update_firebase_notification_informations(jeune_id, registration_token)

    def create_jeune(self, request: CreateJeuneRequest, conseiller_id: str):
        jeune_id = id_generator(id_length=5)
        sql_jeune = SqlJeune(
            id=jeune_id,
            firstName=request.firstName,
            lastName=request.lastName,
            creationDate=datetime.utcnow(),
            conseillerId=conseiller_id
        )
        self.jeuneDatasource.create_jeune(sql_jeune)
        return to_jeune(sql_jeune)
