from datasources.action_creator_database_datasource import ActionCreatorDatabaseDatasource
from model.action_creator import ActionCreator
from model.action_creator_type import ActionCreatorType
from transformers.action_creator_transformer import to_sql_action_creator, to_action_creator


class ActionCreatorRepository:

    def __init__(self, action_creator_datasource: ActionCreatorDatabaseDatasource):
        self.actionCreatorDatasource = action_creator_datasource

    def add_action_creator(self, action_creator: ActionCreator):
        sql_action_creator = to_sql_action_creator(action_creator)
        self.actionCreatorDatasource.add_action_creator(sql_action_creator)

    def get_action_creator(self, creator_id: str, creator_type: ActionCreatorType):
        sql_action_creator = self.actionCreatorDatasource.get_action_creator(creator_id, creator_type)
        return to_action_creator(sql_action_creator)
