from flask_sqlalchemy import SQLAlchemy


class ConseillerDatabaseDatasource:

    def __init__(self, db: SQLAlchemy):
        self.db = db

    def get_random_conseiller(self):
        from sql_model.sql_conseiller import SqlConseiller
        return SqlConseiller.query.first()
