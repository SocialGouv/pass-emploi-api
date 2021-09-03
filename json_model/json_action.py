from model.action import Action


class JsonAction:
    def __init__(self, action: Action):
        self.id = action.id
        self.content = action.content
        self.comment = action.comment
        self.isDone = action.isDone
        self.creationDate = action.creationDate
        self.lastUpdate = action.lastUpdate
