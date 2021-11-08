from datetime import datetime
from typing import Optional


class ActionQueryModel:
    def __init__(
            self,
            id_action: str,
            content: str,
            comment: Optional[str],
            is_done: bool,
            creation_date: datetime,
            last_update: datetime,
            status: str,
            creator_type: str,
            creator: str,
    ):
        self.id = id_action
        self.content = content
        self.comment = comment if comment is not None else ''
        self.isDone = is_done
        self.creationDate = creation_date
        self.lastUpdate = last_update
        self.status = status
        self.creatorType = creator_type
        self.creator = creator
