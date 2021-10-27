import os

from infrastructure.services.pole_emploi.get_token import get_token
from infrastructure.services.utils.requests_session_base_url import SessionWithBaseUrl

API_BASE_URL = os.environ.get('POLE_EMPLOI_API_BASE_URL')


def init_api():
    try:
        token = get_token()

        if not token:
            raise Exception('Bad token')

        session = SessionWithBaseUrl(API_BASE_URL)
        session.headers.update({'Authorization': f'Bearer {token}'})

        return session
    except Exception as err:
        print(err)
        print('Pole Emploi API - Problem initializing API')
        raise
