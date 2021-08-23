from datasources.action_datasource import ActionDatasource
from models.action import Action
from models.jeune import Jeune


class ActionRepository:

    def __init__(self, action_datasource: ActionDatasource):
        self.actionDatasource = action_datasource

    def add_action(self, action: Action):
        self.actionDatasource.add_action(action)

    def create_mocked_actions(self, jeune: Jeune):
        self.actionDatasource.create_mocked_actions(jeune)

    def get_actions(self, jeune: Jeune):
        return self.actionDatasource.get_actions(jeune)

    def update_action(self, action_id: str, action_status: bool):
        self.actionDatasource.update_action(action_id, action_status)
