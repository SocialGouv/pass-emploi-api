from typing import List


class JsonHomeJeune:
    def __init__(self, actions: List[dict], conseiller: dict, rendezvous: List[dict]):
        self.actions = actions
        self.conseiller = conseiller
        self.rendezvous = rendezvous
