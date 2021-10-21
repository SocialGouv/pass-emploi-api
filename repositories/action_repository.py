from datasources.action_database_datasource import ActionDatabaseDatasource
from model.action import Action
from model.jeune import Jeune
from model.jeune_actions_sum_up import JeuneActionsSumUp
from transformers.action_creator_transformer import to_sql_action_creator
from transformers.action_transformer import to_sql_action, to_action


class ActionRepository:

    def __init__(self, action_datasource: ActionDatabaseDatasource):
        self.actionDatasource = action_datasource

    def add_action(self, action: Action) -> None:
        self.actionDatasource.add_action(to_sql_action(action), to_sql_action_creator(action.actionCreator))

    def get_actions(self, jeune: Jeune) -> [Action]:
        return list(map(lambda a: to_action(a), self.actionDatasource.get_actions(jeune.id)))

    def get_actions_sum_up_for_home_conseiller(self, conseiller_id: str) -> [JeuneActionsSumUp]:
        return self.actionDatasource.get_actions_sum_up_for_home_conseiller(conseiller_id)

    def update_action(self, action_id: str, action_status: str) -> None:
        self.actionDatasource.update_action(action_id, action_status)

    def update_action_deprecated(self, action_id: str, is_action_done: bool) -> None:
        self.actionDatasource.update_action_deprecated(action_id, is_action_done)
