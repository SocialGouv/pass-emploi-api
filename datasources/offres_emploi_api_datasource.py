from infrastructure.services.pole_emploi.pole_emploi_api_initializer import PoleEmploiApiInitializer
from infrastructure.services.utils.get_response_json import get_response_json


class OffresEmploiAPIDatasource:

    def __init__(self, pole_emploi_api_initializer: PoleEmploiApiInitializer):
        self.apiInitializer = pole_emploi_api_initializer

    def get_offres_emploi(self):
        SUFFIX_URL = 'offresdemploi/v2/offres/search'
        res = self.apiInitializer.init_api().get(SUFFIX_URL)
        return get_response_json(res)
