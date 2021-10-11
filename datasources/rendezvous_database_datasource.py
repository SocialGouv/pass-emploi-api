from datetime import datetime

from flask_sqlalchemy import SQLAlchemy

from sql_model.sql_rendezvous import SqlRendezvous


class RendezvousDatabaseDatasource:

    def __init__(self, database: SQLAlchemy):
        self.db = database

    def get_rendezvous(self, rendezvous_id: str) -> SqlRendezvous:
        return SqlRendezvous.query.filter_by(id=rendezvous_id).first()

    def get_jeune_rendezvous(self, jeune_id: str, rendezvous_limit_date: datetime, is_soft_deleted: bool) -> \
            [SqlRendezvous]:
        return SqlRendezvous.query \
            .filter_by(jeuneId=jeune_id) \
            .filter_by(isSoftDeleted=is_soft_deleted) \
            .filter(SqlRendezvous.date >= rendezvous_limit_date) \
            .all()

    def get_conseiller_rendezvous(self, conseiller_id: str, is_soft_deleted: bool) -> [SqlRendezvous]:
        return SqlRendezvous.query \
            .filter_by(conseillerId=int(conseiller_id)) \
            .filter_by(isSoftDeleted=is_soft_deleted) \
            .order_by(SqlRendezvous.date) \
            .all()

    def add_rendezvous(self, sql_rendezvous: SqlRendezvous) -> None:
        self.db.session.add(sql_rendezvous)
        self.db.session.commit()

    def delete_rendezvous(self, rendezvous_id: str):
        SqlRendezvous.query.filter_by(id=int(rendezvous_id)).update({"isSoftDeleted": True})
        self.db.session.commit()
