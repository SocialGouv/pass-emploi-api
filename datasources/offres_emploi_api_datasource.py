from typing import Optional

from infrastructure.services.pole_emploi.pole_emploi_api_initializer import PoleEmploiApiInitializer
from infrastructure.services.utils.get_response_json import get_response_json

OFFRES_EMPLOI_SUFFIX_URL = 'offresdemploi/v2/offres/search'


class OffresEmploiAPIDatasource:

    def __init__(self, pole_emploi_api_initializer: PoleEmploiApiInitializer):
        self.apiInitializer = pole_emploi_api_initializer

    def get_offres_emploi(self) -> Optional[dict]:
        response = self.apiInitializer.init_api().get(OFFRES_EMPLOI_SUFFIX_URL)
        return get_response_json(response)
