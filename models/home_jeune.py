from typing import List

from models.action import Action
from models.conseiller import Conseiller


class HomeJeune:

    def __init__(self, actions: List[Action], conseiller: Conseiller):
        self.actions = actions
        self.conseiller = conseiller
