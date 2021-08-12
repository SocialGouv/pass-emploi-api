import random
from datetime import datetime

from datasources.action_datasource import ActionDatasource
from models.action import Action
from models.jeune import Jeune


class ActionRepository:

    def __init__(self, action_datasource: ActionDatasource):
        self.actionDatasource = action_datasource

    def add_action(self, action: Action):
        self.actionDatasource.add_action(action)

    def create_actions(self, jeune: Jeune):
        self.actionDatasource.create_actions(jeune)

    def get_actions(self, jeune: Jeune):
        return self.actionDatasource.get_actions(jeune)

    def set_action_status(self, action_id: int):
        self.actionDatasource.set_action_status(action_id)
