from datetime import datetime

from flask_sqlalchemy import SQLAlchemy

from initialize_db import db
from model.jeune_actions_sum_up import JeuneActionsSumUp
from sql_model.sql_action import SqlAction


class ActionDatabaseDatasource:

    def __init__(self, database: SQLAlchemy):
        self.db = database

    def add_action(self, sql_action: SqlAction) -> None:
        self.db.session.add(sql_action)
        self.db.session.commit()

    def get_actions(self, jeune_id: str) -> [SqlAction]:
        return SqlAction.query.filter_by(jeuneId=jeune_id).all()

    def update_action(self, action_id: str, action_status: bool) -> None:
        sql_action = SqlAction.query.filter_by(id=action_id).first()
        if sql_action is not None:
            sql_action.isDone = action_status
            sql_action.lastUpdate = datetime.utcnow(),
            self.db.session.commit()

    # noinspection SqlAggregates
    def get_actions_sum_up_for_home_conseiller(self, conseiller_id: str) -> [JeuneActionsSumUp]:
        sql_query = """
            SELECT 	
            jeune.id as jeune_id,
            jeune.first_name as jeune_first_name,
            jeune.last_name as jeune_last_name,
            COUNT(CASE WHEN is_done = false AND jeune_id = jeune.id THEN 1 END) as todo_actions_count,
            COUNT(CASE WHEN is_done = true AND jeune_id = jeune.id THEN 1 END) as done_actions_count
            FROM action RIGHT JOIN jeune ON action.jeune_id IN (SELECT id FROM jeune WHERE conseiller_id = %s)
            GROUP BY jeune.id
            ORDER BY jeune.last_name;
        """
        result = db.engine.execute(sql_query % conseiller_id)
        return list(map(lambda row: self.__to_jeune_actions_sum_up(row), result))

    def __to_jeune_actions_sum_up(self, row) -> JeuneActionsSumUp:
        return JeuneActionsSumUp(
            row['jeune_id'],
            row['jeune_first_name'],
            row['jeune_last_name'],
            row['todo_actions_count'],
            row['done_actions_count']
        )
