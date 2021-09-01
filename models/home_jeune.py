from typing import List

from models.action import Action
from models.conseiller import Conseiller
from models.rendezvous import Rendezvous


class HomeJeune:

    def __init__(self, actions: List[Action], done_actions_count: int, conseiller: Conseiller,
                 rendezvous: List[Rendezvous]):
        self.actions = actions
        self.doneActionsCount = done_actions_count
        self.conseiller = conseiller
        self.rendezvous = rendezvous
