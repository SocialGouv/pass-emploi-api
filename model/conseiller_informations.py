from typing import List

from model.conseiller import Conseiller
from model.jeune import Jeune


class ConseillerInformations:

    def __init__(self, conseiller: Conseiller, jeunes: List[Jeune]):
        self.conseiller = conseiller
        self.jeunes = jeunes
