from models.action import Action


class JsonAction:
    def __init__(self, action: Action):
        self.id = action.id
        self.content = action.content
        self.isDone = action.isDone
        self.creationDate = action.creationDate
