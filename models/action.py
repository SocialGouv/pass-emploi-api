from datetime import datetime

from models.jeune import Jeune


class Action:

    def __init__(self,
                 id: int,
                 content: str,
                 is_done: bool,
                 creation_date: datetime,
                 jeune: Jeune):
        self.id = id
        self.content = content
        self.isDone = is_done
        self.creationDate = creation_date
        self.jeune = jeune
