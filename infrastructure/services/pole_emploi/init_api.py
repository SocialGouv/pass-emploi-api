import os

import requests as requests

from infrastructure.services.pole_emploi.get_token import get_token

API_URL = os.environ.get('POLE_EMPLOI_API_URL')


def init_api():
    try:
        token = get_token()

        if not token:
            raise Exception('Bad token')

        session = requests.Session()
        session.headers.update({'Authorization': f'Bearer {token}'})

        return session
    except Exception as err:
        print(err)
        print('Pole Emploi API - Problem initializing API')
        raise
