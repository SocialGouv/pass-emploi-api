from typing import List


class JsonHomeJeune:
    def __init__(self, actions: List[dict], done_actions_count: int, conseiller: dict, rendezvous: List[dict]):
        self.actions = actions
        self.doneActionsCount = done_actions_count
        self.conseiller = conseiller
        self.rendezvous = rendezvous
