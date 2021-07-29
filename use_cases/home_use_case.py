from models.home import Home
from repositories.action_repository import ActionRepository
from repositories.jeune_repository import JeuneRepository


class HomeUseCase:
    def __init__(self, jeune_repository: JeuneRepository, action_repository: ActionRepository):
        self.jeune_repository = jeune_repository
        self.action_repository = action_repository

    def get_home(self, jeune_id: str):
        self.jeune_repository.create_jeune_if_required(jeune_id)
        jeune = self.jeune_repository.get_jeune(jeune_id)
        actions = self.action_repository.get_actions(jeune)
        return Home(actions)

    def set_home_action(self, action_id: str):
        self.action_repository.set_action_status(action_id)
