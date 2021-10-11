from model.jeune import Jeune


class JsonJeuneInformations:

    def __init__(self, jeune: Jeune):
        self.id = jeune.id
        self.firstName = jeune.firstName
        self.lastName = jeune.lastName
        self.creationDate = jeune.creationDate
