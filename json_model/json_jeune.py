from models.jeune import Jeune


class JsonJeune:

    def __init__(self, jeune: Jeune):
        self.id = jeune.id
        self.firstName = jeune.firstName
        self.lastName = jeune.lastName
        self.number = jeune.number
