from typing import Optional

from src.infrastructure.services.pole_emploi.pole_emploi_api import PoleEmploiApi

OFFRES_EMPLOI_SUFFIX_URL = 'offresdemploi/v2/offres/search'


class OffresEmploiAPIDatasource:

    def __init__(self, pole_emploi_api: PoleEmploiApi):
        self.api = pole_emploi_api

    def get_offres_emploi(self, page: int, limit: int, search_term: Optional[str], departement: Optional[str]) -> dict:
        query_params = {
            'sort': 1,
            'range': generate_query_param_range(page, limit)
        }
        if search_term:
            query_params['motsCles'] = search_term
        if departement:
            query_params['departement'] = departement

        return self.api.get(OFFRES_EMPLOI_SUFFIX_URL, query_params)


def generate_query_param_range(page: int, limit: int):
    return f'{(page - 1) * limit}-{(page * limit) - 1}'
