import os
import requests as requests

from infrastructure.services.cache.pole_emploi_token_cache import PoleEmploiTokenCache
from infrastructure.services.utils.get_response_json import get_response_json

LOGIN_URL = os.environ.get('POLE_EMPLOI_LOGIN_URL')
CLIENT_ID = os.environ.get('POLE_EMPLOI_CLIENT_ID')
CLIENT_SECRET = os.environ.get('POLE_EMPLOI_CLIENT_SECRET')
SCOPE = os.environ.get('POLE_EMPLOI_SCOPE')


def get_token():
    query_param = {
        'realm': '/partenaire'
    }
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    body = {
        'grant_type': 'client_credentials',
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'scope': SCOPE
    }

    try:
        cache = PoleEmploiTokenCache()
        cached_token = cache.get()

        if cached_token:
            return cached_token

        login_info_response = requests.post(LOGIN_URL, params=query_param, headers=headers, data=body)
        login_info = get_response_json(login_info_response)
        token = login_info['access_token'] if login_info else None

        if not token:
            raise Exception('Unable to retreive token')

        cache.set(token)
        return token
    # TODO : handle exception/pass
    except Exception as e:
        print(e)
        print('Pole Emploi API - Login Error')
        return None
