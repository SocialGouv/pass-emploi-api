from models.home_jeune import HomeJeune
from repositories.action_repository import ActionRepository
from repositories.jeune_repository import JeuneRepository


class JeuneUseCase:
    def __init__(self, jeune_repository: JeuneRepository):
        self.jeuneRepository = jeune_repository

    def create_jeune(self, jeune_data: dict):
        self.jeuneRepository.create_jeune(jeune_data)
