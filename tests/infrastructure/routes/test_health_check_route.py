from config import PASS_EMPLOI_DEV_URL


def test_health_check(client):
    response = client.get(f'{PASS_EMPLOI_DEV_URL}/')
    assert response.status_code == 200
    assert response.data == b'Pass Emploi'
