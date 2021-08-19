from datetime import datetime

from models.home_jeune import HomeJeune
from repositories.action_repository import ActionRepository
from repositories.jeune_repository import JeuneRepository
from repositories.rendezvous_repository import RendezvousRepository


class JeuneException(Exception):
    pass


class HomeJeuneUseCase:
    def __init__(self, jeune_repository: JeuneRepository, action_repository: ActionRepository,
                 rendezvous_repository: RendezvousRepository):
        self.jeuneRepository = jeune_repository
        self.actionRepository = action_repository
        self.rendezvousRepository = rendezvous_repository

    def get_home(self, jeune_id: str):
        jeune = self.jeuneRepository.get_jeune(jeune_id)
        actions = self.actionRepository.get_actions(jeune)
        rendezvous_limit_date = datetime.utcnow()
        rendez_vous = self.rendezvousRepository.get_rendezvous(jeune, jeune.conseiller, rendezvous_limit_date)
        return HomeJeune(actions, jeune.conseiller, rendez_vous)
