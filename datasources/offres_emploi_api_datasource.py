from infrastructure.services.pole_emploi.init_api import init_api
from infrastructure.services.utils.get_response_json import get_response_json


class OffresEmploiAPIDatasource:

    def __init__(self):
        self.api = init_api()

    def get_offres_emploi(self):
        SUFFIX_URL = 'offresdemploi/v2/offres/search'
        res = self.api.get(SUFFIX_URL)
        return get_response_json(res)
