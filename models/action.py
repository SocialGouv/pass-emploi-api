from datetime import datetime

from models.jeune import Jeune


class Action:
    id: str
    content: str
    isDone: bool
    creationDate: datetime
    jeune: Jeune
