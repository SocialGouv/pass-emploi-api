from typing import List

from models.action import Action
from models.jeune import Jeune


class HomeConseiller:

    def __init__(self, actions: List[Action], jeune: Jeune):
        self.actions = actions
        self.jeune = jeune
