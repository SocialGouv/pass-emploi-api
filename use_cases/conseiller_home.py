from models.action import Action
from models.home import Home
from repositories.action_repository import ActionRepository
from repositories.jeune_repository import JeuneRepository


class ConseillerHome:
    def __init__(self, jeune_repository: JeuneRepository, action_repository: ActionRepository):
        self.actionRepository = action_repository
        self.jeuneRepository = jeune_repository

    def post_action(self, json_action: dict, jeune_id: str):
        jeune = self.jeuneRepository.get_jeune(jeune_id)
        action = Action(json_action['id'], json_action['content'], json_action['isDone'], json_action['creationDate'],
                        json_action['lastUpdate'], jeune)
        self.actionRepository.add_action(action)
        return Home([action], jeune.conseiller)
