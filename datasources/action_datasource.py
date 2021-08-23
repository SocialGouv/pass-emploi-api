import random
from datetime import datetime

from models.action import Action
from models.jeune import Jeune

generic_actions_content = ["Mettre à jour mon CV", "Créer une lettre de motivation", "M'inscrire au permis de conduire",
                           "Mettre mon CV en ligne", "Apprendre l'anglais avec Jason Statham", "Changer de prénom",
                           "Suivre une formation", "Prendre contact avec un employeur pour un stage",
                           "Assister à l’atelier CV à la Mission Locale de Paris, site Soleil.",
                           "Assister à au moins 4 ateliers proposés par Pôle Emploi ou  Mission locale.",
                           "Effectuer un stage d’au moins 2 jours dans le domaine qui me plaît.",
                           "Discuter avec 3 anciens jeunes suivis par Pôle Emploi ou  Mission locale",
                           ]


class ActionDatasource:
    actions = []

    def add_action(self, action: Action):
        self.actions.append(action)

    def create_mocked_actions(self, jeune: Jeune):
        random_actions_content = generic_actions_content.copy()
        for i in range(5):
            random_action_content = random.choice(random_actions_content)
            action = Action(str(random.randint(0, 10000000)), random_action_content, '', False,
                            datetime.utcnow(), datetime.utcnow(), jeune)
            random_actions_content.remove(random_action_content)
            self.actions.append(action)

    def get_actions(self, jeune: Jeune):
        return list(filter(lambda action: action.jeune.id == jeune.id, self.actions))

    def update_action(self, action_id: str, action_status: bool):
        for action in self.actions:
            if action.id == action_id:
                action.isDone = action_status
                action.lastUpdate = datetime.utcnow()
