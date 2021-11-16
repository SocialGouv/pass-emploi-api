from model.action import Action
from model.action_creator_type import ActionCreatorType


class JsonAction:
    def __init__(self, action: Action):
        self.id = action.id
        self.content = action.content
        self.comment = action.comment if action.comment is not None else ''
        self.isDone = action.isDone
        self.creationDate = action.creationDate
        self.lastUpdate = action.lastUpdate
        self.status = action.status.value
        self.creatorType = action.actionCreator.creatorType
        self.creator = self.get_creator_name(action)

    def get_creator_name(self, action):
        if action.actionCreator.creatorType == ActionCreatorType.JEUNE.value:
            return action.jeune.firstName + ' ' + action.jeune.lastName
        else:
            return action.jeune.conseiller.firstName + ' ' + action.jeune.conseiller.lastName
