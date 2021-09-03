from datasources.conseiller_database_datasource import ConseillerDatabaseDatasource
from datasources.jeune_database_datasource import JeuneDatabaseDatasource
from model.conseiller import Conseiller
from model.jeune import Jeune
from transformers.conseiller_transformer import to_conseiller
from transformers.jeune_transformer import to_jeune


class ConseillerRepository:
    def __init__(self, conseiller_datasource: ConseillerDatabaseDatasource, jeune_datasource: JeuneDatabaseDatasource):
        self.conseillerDatasource = conseiller_datasource
        self.jeuneDatasource = jeune_datasource

    def get_jeunes(self, conseiller: Conseiller) -> [Jeune]:
        sql_jeunes_list = self.jeuneDatasource.get_jeunes_list(int(conseiller.id))
        return list(map(lambda sql_jeune: to_jeune(sql_jeune), sql_jeunes_list))

    def get_random_conseiller(self) -> Conseiller:
        return to_conseiller(self.conseillerDatasource.get_random_conseiller())
