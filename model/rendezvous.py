from datetime import datetime, timedelta

from model.conseiller import Conseiller
from model.jeune import Jeune


class Rendezvous:

    def __init__(
            self,
            id: str,
            title: str,
            subtitle: str,
            comment: str,
            modality: str,
            date: datetime,
            duration: timedelta,
            jeune: Jeune,
            conseiller: Conseiller
    ):
        self.id = id
        self.title = title
        self.subtitle = subtitle
        self.comment = comment
        self.modality = modality
        self.date = date
        self.duration = duration
        self.jeune = jeune
        self.conseiller = conseiller
