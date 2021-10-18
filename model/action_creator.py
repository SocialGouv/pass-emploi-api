from typing import Optional

from model.action_creator_type import ActionCreatorType


class ActionCreator:

    def __init__(
            self,
            creator_id: str,
            action_creator_type: ActionCreatorType,
            id: Optional[int] = None,
    ):
        self.id = id
        self.creatorId = creator_id
        self.creatorType = action_creator_type.value
