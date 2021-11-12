import pickle

from src.application.queries.query_models.offres_emploi_query_model import OffresEmploiQueryModel
from src.infrastructure.transformers.offres_emploi_transformer import to_offres_emploi_query_model
from tests.mocks.offres_emploi_mocks import POLE_EMPLOI_API


class TestOffresEmploiTransformer:
    def test_to_offres_emploi_returns_results(self):
        mocked_page = 1
        mocked_limit = 10
        mocked_offres_emploi = POLE_EMPLOI_API['offres_emploi']

        received_offres_emploi = to_offres_emploi_query_model(mocked_page, mocked_limit, mocked_offres_emploi)

        expected_pagination = {
            'page': mocked_page,
            'limit': mocked_limit
        }
        expected_results = [
            {
                'id': '4369834',
                'titre': 'Technicien Informatique H/F',
                'typeContrat': 'CDD',
                'duree': 'Temps plein',
                'nomEntreprise': 'Offre RH',
                'localisation': {
                    'nom': '51 - REIMS',
                    'codePostal': '51100',
                    'commune': '51454'
                }
            },
            {
                'id': '4162319',
                'titre': 'Technicien support applicatif',
                'typeContrat': 'CDI',
                'duree': None,
                'nomEntreprise': None,
                'localisation': None
            }
        ]
        expected_offres_emploi = OffresEmploiQueryModel(expected_pagination, expected_results)

        assert pickle.dumps(received_offres_emploi) == pickle.dumps(expected_offres_emploi)

    def test_to_offres_emploi_returns_empty_results(self):
        mocked_page = 1
        mocked_limit = 10
        mocked_offres_emploi = POLE_EMPLOI_API['offres_emploi_empty']

        received_offres_emploi = to_offres_emploi_query_model(mocked_page, mocked_limit, mocked_offres_emploi)

        expected_pagination = {
            'page': mocked_page,
            'limit': mocked_limit
        }
        expected_results = []
        expected_offres_emploi = OffresEmploiQueryModel(expected_pagination, expected_results)

        assert pickle.dumps(received_offres_emploi) == pickle.dumps(expected_offres_emploi)
