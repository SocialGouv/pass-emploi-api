from models.conseiller import Conseiller


class Jeune:

    def __init__(self, id: str, conseiller: Conseiller):
        self.id = id
        self.conseiller = conseiller
