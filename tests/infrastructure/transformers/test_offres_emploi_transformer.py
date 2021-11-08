import pickle

from src.domain.offres_emploi.offre_emploi import OffreEmploi
from src.infrastructure.transformers.offres_emploi_transformer import to_offres_emploi
from tests.mocks.offres_emploi_mocks import POLE_EMPLOI_API


class TestOffresEmploiTransformer:
    def test_to_offres_emploi_returns_list_of_offre_emploi(self):
        mocked_offres_emploi = POLE_EMPLOI_API['offres_emploi']

        received_offres_emploi = to_offres_emploi(mocked_offres_emploi)

        expected_offres_emploi = [
            OffreEmploi(
                '4369834', 'Technicien Informatique H/F', 'CDD', 'Offre RH', {
                    'nom': '51 - REIMS', 'code_postal': '51100',
                    'commune': '51454'
                }
            ),
            OffreEmploi(
                '4162319', 'Technicien support applicatif', 'CDI', None, None
            ), ]

        assert pickle.dumps(received_offres_emploi) == pickle.dumps(expected_offres_emploi)

    def test_to_offres_emploi_returns_empty_list_of_offre_emploi(self):
        mocked_offres_emploi = POLE_EMPLOI_API['offres_emploi_empty']

        received_offres_emploi = to_offres_emploi(mocked_offres_emploi)

        expected_offres_emploi = []

        assert received_offres_emploi == expected_offres_emploi
