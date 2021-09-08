from typing import List

from model.action import Action
from model.conseiller import Conseiller
from model.rendezvous import Rendezvous


class HomeJeune:

    def __init__(
            self,
            actions: List[Action],
            done_actions_count: int,
            conseiller: Conseiller,
            rendezvous: List[Rendezvous]
    ):
        self.actions = actions
        self.doneActionsCount = done_actions_count
        self.conseiller = conseiller
        self.rendezvous = rendezvous
