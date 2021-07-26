from datasources.jeune_datasource import JeuneDatasource
from models.jeune import Jeune
from repositories.action_repository import ActionRepository


class JeuneRepository:

    def __init__(self, jeune_datasource: JeuneDatasource, action_repository: ActionRepository):
        self.jeune_datasource = jeune_datasource
        self.actionRepository = action_repository

    def initialize_jeune_if_required(self, jeune_id: str):
        if not self.jeune_datasource.exists(jeune_id):
            jeune = Jeune(jeune_id)
            self.jeune_datasource.create_jeune(jeune)
            self.actionRepository.create_actions(jeune)

    def get_jeune(self, jeune_id: str):
        return self.jeune_datasource.get(jeune_id)
