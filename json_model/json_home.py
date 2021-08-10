from typing import List


class JsonHome:
    def __init__(self, actions: List[dict], conseiller: dict):
        self.actions = actions
        self.conseiller = conseiller
