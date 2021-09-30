from typing import List


class JsonConseillerInformations:
    def __init__(self, conseiller: dict, jeunes: List[dict]):
        self.conseiller = conseiller
        self.jeunes = jeunes
