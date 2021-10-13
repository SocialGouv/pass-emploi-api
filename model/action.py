from datetime import datetime
from typing import Optional

from model.action_creator import ActionCreator
from model.action_status import ActionStatus
from model.jeune import Jeune


class Action:

    def __init__(
            self,
            content: str,
            comment: Optional[str],
            is_done: bool,
            is_visible_by_conseiller: bool,
            creation_date: datetime,
            limit_date: datetime,
            last_update: datetime,
            status: ActionStatus,
            jeune: Jeune,
            action_creator: ActionCreator,
            id: Optional[str] = None
    ):
        self.id = id
        self.content = content
        self.comment = comment
        self.isDone = is_done
        self.isVisibleByConseiller = is_visible_by_conseiller
        self.creationDate = creation_date
        self.limitDate = limit_date
        self.lastUpdate = last_update
        self.status = status
        self.jeune = jeune
        self.actionCreator = action_creator

# test and fix tests
# transformer and test
# alembic migration
# change routes and logic if needed
