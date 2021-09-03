from datasources.conseiller_database_datasource import ConseillerDatabaseDatasource
from datasources.jeune_database_datasource import JeuneDatabaseDatasource
from model.conseiller import Conseiller
from model.jeune import Jeune


class ConseillerRepository:

    def __init__(self, conseiller_datasource: ConseillerDatabaseDatasource, jeune_datasource: JeuneDatabaseDatasource):
        self.conseillerDatasource = conseiller_datasource
        self.jeuneDatasource = jeune_datasource

    def get_jeunes(self, conseiller: Conseiller):
        sql_jeunes_list = self.jeuneDatasource.get_jeunes_list(int(conseiller.id))
        return list(map(lambda j: Jeune(j.id, j.firstName, j.lastName,
                                        Conseiller(str(j.conseiller.id), j.conseiller.firstName,
                                                   j.conseiller.lastName)), sql_jeunes_list))

    def get_random_conseiller(self):
        sql_conseiller = self.conseillerDatasource.get_random_conseiller()
        return Conseiller(str(sql_conseiller.id), sql_conseiller.firstName, sql_conseiller.lastName)
