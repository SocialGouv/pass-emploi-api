from datasources.jeune_datasource import JeuneDatasource


class ConseillerRepository:

    def __init__(self, jeune_datasource: JeuneDatasource):
        self.jeuneDatasource = jeune_datasource

    def get_jeunes(self):
        return self.jeuneDatasource.get_jeunes_list()
