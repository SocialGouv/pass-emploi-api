from sql_model.sql_conseiller import SqlConseiller


class ConseillerDatabaseDatasource:

    def get(self, conseiller_id: int):
        return SqlConseiller.query.filter_by(id=conseiller_id).first()
