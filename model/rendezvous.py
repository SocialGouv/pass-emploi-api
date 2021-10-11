from datetime import datetime, timedelta
from typing import Optional

from model.conseiller import Conseiller
from model.jeune import Jeune


class Rendezvous:

    def __init__(
            self,
            title: str,
            subtitle: Optional[str],
            comment: Optional[str],
            modality: Optional[str],
            date: datetime,
            duration: timedelta,
            is_soft_deleted: bool,
            jeune: Jeune,
            conseiller: Conseiller,
            id: Optional[str] = None
    ):
        self.id = id
        self.title = title
        self.subtitle = subtitle
        self.comment = comment
        self.modality = modality
        self.date = date
        self.duration = duration
        self.isSoftDeleted = is_soft_deleted
        self.jeune = jeune
        self.conseiller = conseiller
