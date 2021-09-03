from typing import List

from model.action import Action
from model.jeune import Jeune


class HomeConseiller:

    def __init__(self, actions: List[Action], jeune: Jeune):
        self.actions = actions
        self.jeune = jeune
