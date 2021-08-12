from models.home import Home
from repositories.action_repository import ActionRepository
from repositories.jeune_repository import JeuneRepository


class HomeJeune:
    def __init__(self, jeune_repository: JeuneRepository, action_repository: ActionRepository):
        self.jeuneRepository = jeune_repository
        self.actionRepository = action_repository

    def get_home(self, jeune_id: str):
        self.jeuneRepository.create_jeune_if_required(jeune_id)
        jeune = self.jeuneRepository.get_jeune(jeune_id)
        actions = self.actionRepository.get_actions(jeune)
        return Home(actions, jeune.conseiller)

    def change_action_status(self, action_id: int):
        self.actionRepository.set_action_status(action_id)
