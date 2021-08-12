from typing import List


class JsonHomeConseiller:
    def __init__(self, actions: List[dict], jeune: dict):
        self.actions = actions
        self.jeune = jeune
