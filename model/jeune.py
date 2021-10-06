import datetime

from model.conseiller import Conseiller


class Jeune:

    def __init__(self, id: str, first_name: str, last_name: str, firebase_token: str, token_last_update: datetime,
                 conseiller: Conseiller):
        self.id = id
        self.firstName = first_name
        self.lastName = last_name
        self.firebaseToken = firebase_token
        self.tokenLastUpdate = token_last_update
        self.conseiller = conseiller
