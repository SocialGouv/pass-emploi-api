from typing import List

from models.action import Action
from models.conseiller import Conseiller
from models.rendezvous import Rendezvous


class HomeJeune:

    def __init__(self, actions: List[Action], conseiller: Conseiller, rendezvous: List[Rendezvous]):
        self.actions = actions
        self.conseiller = conseiller
        self.rendezvous = rendezvous
