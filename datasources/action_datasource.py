from typing import List

from models.action import Action
from models.jeune import Jeune


class ActionDatasource:
    actions = List[Action]

    def save(self, action: Action):
        self.actions += action

    def get_actions(self, jeune: Jeune):
        return [action for action in self.actions if action.jeune == jeune]
