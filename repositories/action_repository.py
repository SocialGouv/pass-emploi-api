import random
from datetime import datetime

from datasources.action_datasource import ActionDatasource
from models.action import Action
from models.jeune import Jeune

generic_actions_content = ["Mettre à jour mon CV", "Créer une lettre de motivation", "M'inscrire au permis de conduire",
                           "Mettre mon CV en ligne", "Apprendre l'anglais avec Jason Statham", "Changer de prénom",
                           "Suivre une formation"]


class ActionRepository:

    def __init__(self, action_datasource: ActionDatasource):
        self.actionDatasource = action_datasource

    def create_actions(self, jeune: Jeune):
        for i in range(5):
            action = Action(random.randint(0, 10000000), random.choice(generic_actions_content), False,
                            datetime.utcnow(), jeune)
            self.actionDatasource.add(action)

    def get_actions(self, jeune: Jeune):
        return self.actionDatasource.get_actions(jeune)

    def set_action_status(self, action_id: str):
        for action in self.actionDatasource.actions:
            if action.id == int(action_id):
                action.isDone = not action.isDone
