import random
from datetime import datetime, timedelta

from flask_sqlalchemy import SQLAlchemy

from model.conseiller import Conseiller
from model.jeune import Jeune
from sql_model.sql_rendezvous import SqlRendezvous

generic_comments = [
    "Atelier préparation CV",
    "Atelier recherche formation",
    "Suivi des actions",
    "Suivi des démarches pro",
    "Propositions de formations",
    "Préparation aux entretiens"
]


class RendezvousDatabaseDatasource:
    def __init__(self, db: SQLAlchemy):
        self.db = db

    def get_jeune_rendezvous(self, jeune_id: str, rendezvous_limit_date: datetime) -> [SqlRendezvous]:
        return SqlRendezvous.query \
            .filter_by(jeuneId=jeune_id) \
            .filter(SqlRendezvous.date >= rendezvous_limit_date) \
            .all()

    def get_conseiller_rendezvous(self, conseiller_id: str, rendezvous_limit_date: datetime) -> [SqlRendezvous]:
        return SqlRendezvous.query \
            .filter_by(conseillerId=int(conseiller_id)) \
            .filter(SqlRendezvous.date >= rendezvous_limit_date) \
            .order_by(SqlRendezvous.date) \
            .all()

    def create_mocked_rendezvous(self, jeune: Jeune, conseiller: Conseiller) -> None:
        random_comments = generic_comments.copy()
        for i in range(5):
            random_comment = random.choice(random_comments)
            sql_rendezvous = SqlRendezvous(
                title='Rendez-vous conseiller',
                subtitle='avec ' + conseiller.firstName,
                comment=random_comment,
                modality='Par tel',
                date=datetime(2022, 12, 12),
                duration=timedelta(minutes=60),
                jeuneId=jeune.id,
                conseillerId=conseiller.id
            )
            random_comments.remove(random_comment)
            self.db.session.add(sql_rendezvous)
        self.db.session.commit()

    def add_rendezvous(self, sql_rendezvous: SqlRendezvous) -> None:
        self.db.session.add(sql_rendezvous)
        self.db.session.commit()
