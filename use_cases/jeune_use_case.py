from repositories.jeune_repository import JeuneRepository
from use_cases.create_jeune_request import CreateJeuneRequest


class JeuneUseCase:
    def __init__(self, jeune_repository: JeuneRepository):
        self.jeuneRepository = jeune_repository

    def create_jeune(self, request: CreateJeuneRequest):
        self.jeuneRepository.create_jeune(request)
