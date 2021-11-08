import os
from typing import Optional

import requests

from src.infrastructure.services.pole_emploi.pole_emploi_api_token_retriever import PoleEmploiAPITokenRetriever
from src.infrastructure.services.utils.get_response_json import get_response_json

LOGIN_URL = os.environ.get('POLE_EMPLOI_LOGIN_URL')
CLIENT_ID = os.environ.get('POLE_EMPLOI_CLIENT_ID')
CLIENT_SECRET = os.environ.get('POLE_EMPLOI_CLIENT_SECRET')
SCOPE = os.environ.get('POLE_EMPLOI_SCOPE')


class PoleEmploiAPITokenNetworkRetriever(PoleEmploiAPITokenRetriever):

    def get_api_token(self) -> Optional[str]:
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
            login_info_response = requests.post(LOGIN_URL, params=query_param, headers=headers, data=body)
            login_info = get_response_json(login_info_response)
            return login_info['access_token'] if login_info else None
        except Exception as e:
            print(e)
            print('Pole Emploi API - Login Error')
            return None
