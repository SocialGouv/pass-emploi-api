from models.conseiller import Conseiller


class Jeune:

    def __init__(self, id: str, first_name: str, last_name: str, conseiller: Conseiller):
        self.id = id
        self.firstName = first_name,
        self.lastName = last_name,
        self.conseiller = conseiller
