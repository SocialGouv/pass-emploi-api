from flask_sqlalchemy import SQLAlchemy

from model.action_creator_type import ActionCreatorType
from sql_model.sql_action_creator import SqlActionCreator


class ActionCreatorDatabaseDatasource:

    def __init__(self, database: SQLAlchemy):
        self.db = database

    def add_action_creator(self, sql_action_creator: SqlActionCreator) -> None:
        creator_does_not_exist = SqlActionCreator.query.filter_by(creatorId=sql_action_creator.creatorId,
                                                                  actionCreatorType=sql_action_creator.actionCreatorType) \
                                                                    .first() is None
        if creator_does_not_exist:
            self.db.session.add(sql_action_creator)
            self.db.session.commit()

    def get_action_creator(self, creator_id: str, creator_type: ActionCreatorType) -> SqlActionCreator:
        return SqlActionCreator.query.filter_by(creatorId=creator_id, actionCreatorType=creator_type).first()
