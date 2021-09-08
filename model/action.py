from datetime import datetime
from typing import Optional

from model.jeune import Jeune


class Action:

    def __init__(
            self,
            content: str,
            comment: Optional[str],
            is_done: bool,
            creation_date: datetime,
            last_update: datetime,
            jeune: Jeune,
            id: Optional[str] = None
    ):
        self.id = id
        self.content = content
        self.comment = comment
        self.isDone = is_done
        self.creationDate = creation_date
        self.lastUpdate = last_update
        self.jeune = jeune
