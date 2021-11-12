from unittest import mock

from config import PASS_EMPLOI_DEV_URL
from tests.mocks.offres_emploi_mocks import POLE_EMPLOI_API


@mock.patch('src.infrastructure.datasources.offres_emploi_api_datasource.PoleEmploiApi.get')
def test_offres_emploi(mocked_offres_emploi, client):
    mocked_offres_emploi.return_value = POLE_EMPLOI_API['offres_emploi']

    response = client.get(f'{PASS_EMPLOI_DEV_URL}/offres-emploi')

    assert response.status_code == 200
    mocked_offres_emploi.assert_called_once()

    assert response.data == b'{"pagination":{"limit":50,"page":1},"results":[{"duree":"Temps plein","id":"4369834","localisation":{"codePostal":"51100","commune":"51454","nom":"51 - REIMS"},"nomEntreprise":"Offre RH","titre":"Technicien Informatique H/F","typeContrat":"CDD"},{"duree":null,"id":"4162319","localisation":null,"nomEntreprise":null,"titre":"Technicien support applicatif","typeContrat":"CDI"}]}\n'
