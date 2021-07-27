from typing import List

from models.action import Action


class Home:
    def __init__(self, actions: List[Action]):
        self.actions = actions


