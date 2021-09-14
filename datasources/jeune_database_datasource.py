from flask_sqlalchemy import SQLAlchemy

from model.jeune import Jeune
from sql_model.sql_jeune import SqlJeune


class JeuneDatabaseDatasource:

    def __init__(self, database: SQLAlchemy):
        self.db = database

    def exists(self, jeune_id: str):
        return SqlJeune.query.filter_by(id=jeune_id).first() is not None

    def create_jeune(self, sql_jeune: Jeune):
        self.db.session.add(sql_jeune)
        self.db.session.commit()

    def get(self, jeune_id: str):
        return SqlJeune.query.filter_by(id=jeune_id).first()

    def get_jeunes_list(self, conseiller_id: int):
        return SqlJeune.query.filter_by(conseillerId=conseiller_id).all()
