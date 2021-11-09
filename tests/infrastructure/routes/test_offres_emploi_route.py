import json
from unittest import mock

from config import PASS_EMPLOI_DEV_URL
from tests.mocks.offres_emploi_mocks import POLE_EMPLOI_API


@mock.patch('src.infrastructure.datasources.offres_emploi_api_datasource.PoleEmploiApi.get')
def test_offres_emploi(mocked_offres_emploi, client):
    mocked_offres_emploi.return_value = POLE_EMPLOI_API['offres_emploi']

    response = client.get(f'{PASS_EMPLOI_DEV_URL}/offres-emploi')

    assert response.status_code == 200
    mocked_offres_emploi.assert_called_once()
    assert response.data == bytes(
        json.dumps(
            [
                {
                    "id": "4369834",
                    "title": "Technicien Informatique H/F",
                    "type_contrat": "CDD",
                    "nom_entreprise": "Offre RH",
                    "localisation": {
                        "nom": "51 - REIMS",
                        "code_postal": "51100",
                        "commune": "51454"
                    },
                },
                {
                    "id": "4162319",
                    "title": "Technicien support applicatif",
                    "type_contrat": "CDI",
                    "nom_entreprise": None,
                    "localisation": None
                }
            ]
        ), 'utf-8'
    )
