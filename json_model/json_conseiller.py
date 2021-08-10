from models.conseiller import Conseiller


class JsonConseiller:

    def __init__(self, conseiller: Conseiller):
        self.id = conseiller.id
        self.firstName = conseiller.firstName
        self.lastName = conseiller.lastName
