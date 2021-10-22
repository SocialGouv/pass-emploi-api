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
        self.status = action.status
        self.creatorType = action.actionCreator.creatorType
        self.creator = action.jeune.firstName + ' ' + action.jeune.lastName \
            if action.actionCreator.creatorType == ActionCreatorType.JEUNE\
            else action.jeune.conseiller.firstName + ' ' + action.jeune.conseiller.lastName
