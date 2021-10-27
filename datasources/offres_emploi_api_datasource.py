from infrastructure.services.pole_emploi.init_api import init_api


class OffresEmploiAPIDatasource:

    def __init__(self):
        self.api = init_api()

    def get_offres_emploi(self):
        SUFFIX_URL = 'offresdemploi/v2/offres/search'
        res = self.api.get(SUFFIX_URL).json()
        return res
