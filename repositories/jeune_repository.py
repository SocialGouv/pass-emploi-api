from firebase.firebase_chat import FirebaseChat
from datasources.jeune_datasource import JeuneDatasource
from models.conseiller import Conseiller
from models.jeune import Jeune
from repositories.action_repository import ActionRepository


class JeuneRepository:

    def __init__(self, jeune_datasource: JeuneDatasource, action_repository: ActionRepository, firebase_chat: FirebaseChat):
        self.jeuneDatasource = jeune_datasource
        self.actionRepository = action_repository
        self.firebaseChat = firebase_chat

    def create_jeune_if_required(self, jeune_id: str):
        if not self.jeuneDatasource.exists(jeune_id):
            conseiller = Conseiller('1', 'Nils', 'Tavernier')
            jeune = Jeune(jeune_id, conseiller)
            self.firebaseChat.initialise_chat_if_required(jeune.id, conseiller.id)
            self.jeuneDatasource.create_jeune(jeune)
            self.actionRepository.create_actions(jeune)   #Refacto: remove to home use case

    def get_jeune(self, jeune_id: str):
        return self.jeuneDatasource.get(jeune_id)
