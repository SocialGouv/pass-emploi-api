from repositories.action_repository import ActionRepository
from repositories.jeune_repository import JeuneRepository
from use_cases.create_jeune_request import CreateJeuneRequest


class JeuneUseCase:
    def __init__(self, jeune_repository: JeuneRepository, action_repository: ActionRepository):
        self.jeuneRepository = jeune_repository
        self.actionRepository = action_repository

    def create_jeune(self, request: CreateJeuneRequest):
        return self.jeuneRepository.create_jeune(request)

    def create_jeune_with_default_actions(self, request: CreateJeuneRequest):
        jeune = self.create_jeune(request)
        self.actionRepository.create_actions(jeune)
