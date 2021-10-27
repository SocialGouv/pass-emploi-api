import json


class OffresEmploi:

    def __init__(self, offres_emploi):
        self.results = offres_emploi['resultats']

    def to_json(self):
        return json.dumps(self.results)
