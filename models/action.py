from datetime import datetime

from models.jeune import Jeune


class Action:

    def __init__(self,
                 id: int,
                 content: str,
                 comment: str,
                 is_done: bool,
                 creation_date: datetime,
                 last_update: datetime,
                 jeune: Jeune):
        self.id = id
        self.content = content
        self.comment = comment
        self.isDone = is_done
        self.creationDate = creation_date
        self.lastUpdate = last_update
        self.jeune = jeune
