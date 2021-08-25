from datasources.jeune_datasource import JeuneDatasource
from models.conseiller import Conseiller


class ConseillerRepository:

    def __init__(self, jeune_datasource: JeuneDatasource):
        self.jeuneDatasource = jeune_datasource

    def get_jeunes(self, conseiller: Conseiller):
        return self.jeuneDatasource.get_jeunes_list(conseiller)
