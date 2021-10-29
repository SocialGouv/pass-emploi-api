from unittest import mock

from config import PASS_EMPLOI_DEV_URL
from tests.infrastructure.routes.mocks import POLE_EMPLOI_API


@mock.patch('repositories.offres_emploi_repository.OffresEmploiAPIDatasource.get_offres_emploi')
def test_offres_emploi(mocked_offres_emploi, client):
    mocked_resultats = POLE_EMPLOI_API['offres_emploi']

    mocked_offres_emploi.return_value = {
        "resultats": mocked_resultats
    }

    response = client.get(f'{PASS_EMPLOI_DEV_URL}/offres-emploi')
    assert response.status_code == 200
    mocked_offres_emploi.assert_called_once()
    print(response.data)
    assert response.data == b'[{"title": "Technicien Informatique H/F", "description": "OFFRE1: \\n description1"},' \
                            b' {"title": "Technicien support applicatif", "description": "OFFRE2: \\n description2"}]'
