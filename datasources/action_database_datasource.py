import random
from datetime import datetime

from flask_sqlalchemy import SQLAlchemy

from sql_model.sql_action import SqlAction

generic_actions_content = ["Mettre à jour mon CV", "Créer une lettre de motivation", "M'inscrire au permis de conduire",
                           "Mettre mon CV en ligne", "Apprendre l'anglais avec Jason Statham", "Changer de prénom",
                           "Suivre une formation", "Prendre contact avec un employeur pour un stage",
                           "Assister à l’atelier CV à la Mission Locale de Paris, site Soleil.",
                           "Assister à au moins 4 ateliers proposés par Pôle Emploi ou  Mission locale.",
                           "Effectuer un stage d’au moins 2 jours dans le domaine qui me plaît.",
                           "Discuter avec 3 anciens jeunes suivis par Pôle Emploi ou  Mission locale",
                           ]


class ActionDatabaseDatasource:

    def __init__(self, db: SQLAlchemy):
        self.db = db

    def add_action(self, sql_action: SqlAction) -> None:
        self.db.session.add(sql_action)
        self.db.session.commit()

    def create_mocked_actions(self, jeune_id: str) -> None:
        random_actions_content = generic_actions_content.copy()
        for i in range(5):
            random_action_content = random.choice(random_actions_content)
            sql_action = SqlAction(
                content=random_action_content,
                comment='',
                isDone=False,
                creationDate=datetime.utcnow(),
                lastUpdate=datetime.utcnow(),
                jeuneId=jeune_id
            )
            random_actions_content.remove(random_action_content)
            self.db.session.add(sql_action)
        self.db.session.commit()

    def get_actions(self, jeune_id: str) -> [SqlAction]:
        return SqlAction.query.filter_by(jeuneId=jeune_id).all()

    def update_action(self, action_id: str, action_status: bool) -> None:
        sql_action = SqlAction.query.filter_by(id=action_id).first()
        if sql_action is not None:
            sql_action.isDone = action_status
            self.db.session.commit()
