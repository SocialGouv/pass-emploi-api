from models.action import Action
from models.home_conseiller import HomeConseiller
from repositories.action_repository import ActionRepository
from repositories.jeune_repository import JeuneRepository


class HomeConseillerUseCase:
    def __init__(self, jeune_repository: JeuneRepository, action_repository: ActionRepository):
        self.actionRepository = action_repository
        self.jeuneRepository = jeune_repository

    # TODO refacto remove this action from use_case
    def post_action_for_jeune(self, json_action: dict, jeune_id: str):
        jeune = self.jeuneRepository.get_jeune(jeune_id)
        action = Action(json_action['id'], json_action['content'],
                        json_action['isDone'], json_action['creationDate'],
                        json_action['lastUpdate'], jeune)
        self.actionRepository.add_action(action)
        return HomeConseiller([action], jeune)

    def change_action_status(self, action_id: int):
        self.actionRepository.set_action_status(action_id)

    def get_jeune_actions(self, jeune_id: str):
        self.jeuneRepository.create_jeune_if_required(jeune_id)
        jeune = self.jeuneRepository.get_jeune(jeune_id)
        actions = self.actionRepository.get_actions(jeune)
        return HomeConseiller(actions, jeune)
