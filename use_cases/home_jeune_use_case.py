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
        if jeune is not None:
            actions = self.actionRepository.get_actions(jeune)
            rendezvous = self.rendezvousRepository.get_rendezvous(jeune, jeune.conseiller, datetime.utcnow())
            return HomeJeune(get_most_recent_todo_actions(actions), jeune.conseiller, rendezvous)
        else:
            return None


def get_most_recent_todo_actions(actions):
    todo_actions = list(filter(lambda action: not action.isDone, actions))
    todo_actions.sort(key=lambda action: action.lastUpdate, reverse=True)
    most_recent_todo_actions = todo_actions[0:2]
    return most_recent_todo_actions
