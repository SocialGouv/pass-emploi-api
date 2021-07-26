from datasources.jeune_datasource import JeuneDatasource
from models.jeune import Jeune


class JeuneRepository():
    def __init__(self, jeune_datasource: JeuneDatasource):
        self.jeune_datasource = jeune_datasource

    def create_jeune_if_required(self, jeune_id: str):
        if not self.jeune_datasource.exists(jeune_id):
            jeune = Jeune(jeune_id)
            self.jeune_datasource.create_jeune(jeune)
