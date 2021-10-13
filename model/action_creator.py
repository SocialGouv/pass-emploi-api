from model.action import Action
from model.action_creator_type import ActionCreatorType


class ActionCreator:

    def __init__(
            self,
            id: str,
            creator_id: str,
            action_creator_type: ActionCreatorType,
            action: Action
    ):
        self.id = id
        self.creatorId = creator_id
        self.creatorType = action_creator_type
        self.action = action
