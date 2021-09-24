from datasources.jeune_database_datasource import JeuneDatabaseDatasource
from firebase.firebase_chat import FirebaseChat
from model.jeune import Jeune
from transformers.jeune_transformer import to_jeune


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
