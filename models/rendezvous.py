from datetime import datetime, timedelta

from models.conseiller import Conseiller
from models.jeune import Jeune


class Rendezvous:

    def __init__(self,
                 id: str,
                 comment: str,
                 date: datetime,
                 duration: timedelta,
                 jeune: Jeune,
                 conseiller: Conseiller,
                 modality: str,
                 ):
        self.id = id
        self.comment = comment
        self.date = date
        self.duration = duration
        self.jeune = jeune
        self.conseiller = conseiller
        self.modality = modality
