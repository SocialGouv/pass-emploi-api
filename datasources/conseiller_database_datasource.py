from sql_model.sql_conseiller import SqlConseiller


class ConseillerDatabaseDatasource:

    def get_random_conseiller(self):
        return SqlConseiller.query.first()
