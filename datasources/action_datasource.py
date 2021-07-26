from models.action import Action
from models.jeune import Jeune


class ActionDatasource:
    actions = []

    def save(self, action: Action):
        self.actions.append(action)

    def get_actions(self, jeune: Jeune):
        return [action for action in self.actions if action.jeune == jeune]
