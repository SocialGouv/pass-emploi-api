import os

import requests as requests

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
        login_info_reponse = requests.post(LOGIN_URL, params=query_param, headers=headers, data=body)

        login_info = login_info_reponse.json() if login_info_reponse else None

        token = login_info['access_token'] if login_info else None

        return token
    # TODO : handle exception/pass
    except Exception:
        print('Pole Emploi API - Login Error')
        return None
