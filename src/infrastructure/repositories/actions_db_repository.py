from typing import Optional

from datasources.action_database_datasource import ActionDatabaseDatasource
from model.action import Action
from model.jeune import Jeune
from model.jeune_actions_sum_up import JeuneActionsSumUp
from src.application.queries.query_models.action_query_model import ActionQueryModel
from src.application.repositories.actions_repository import ActionsRepository
from src.infrastructure.transformers.action_transformer import to_sql_action, to_action, to_action_query_model


class ActionsDbRepository(ActionsRepository):
    def __init__(self, actions_datasource: ActionDatabaseDatasource):
        self.actions_datasource = actions_datasource

    def get_query_model(self, id_action: str) -> Optional[ActionQueryModel]:
        action = self.actions_datasource.get_action(id_action)
        return to_action_query_model(action)

    def add_action(self, action: Action) -> None:
        sql_action = to_sql_action(action)
        self.actions_datasource.add_action(sql_action)

    def get_actions(self, jeune: Jeune) -> [Action]:
        return list(map(lambda a: to_action(a), self.actions_datasource.get_actions(jeune.id)))

    def get_actions_sum_up_for_home_conseiller(self, conseiller_id: str) -> [JeuneActionsSumUp]:
        return self.actions_datasource.get_actions_sum_up_for_home_conseiller(conseiller_id)

    def update_action(self, action_id: str, action_status: str) -> None:
        self.actions_datasource.update_action(action_id, action_status)

    def update_action_deprecated(self, action_id: str, is_action_done: bool) -> None:
        self.actions_datasource.update_action_deprecated(action_id, is_action_done)
