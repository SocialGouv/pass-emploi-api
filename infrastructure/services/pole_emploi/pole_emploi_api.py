import os
from typing import Optional

from requests import Session
from infrastructure.services.pole_emploi.pole_emploi_api_token_retriever import PoleEmploiAPITokenRetriever
from infrastructure.services.utils.get_response_json import get_response_json
from infrastructure.services.utils.requests_session_base_url import SessionWithBaseUrl

API_BASE_URL = os.environ.get('POLE_EMPLOI_API_BASE_URL')


class PoleEmploiApi:
    def __init__(self, token_retriever: PoleEmploiAPITokenRetriever):
        self.tokenRetriever = token_retriever

    def get(self, suffix_url: str, query_params: Optional[dict] = None) -> dict:
        try:
            api = init_api(self.tokenRetriever)

            response = api.get(suffix_url, params=query_params or {})

            return get_response_json(response, 'Pole Emploi API - GET')
        except Exception as e:
            print(e)
            raise e


def init_api(tokenRetriever: PoleEmploiAPITokenRetriever) -> Session:
    try:
        token = tokenRetriever.get_api_token()

        if not token:
            raise Exception('Bad token')

        session = SessionWithBaseUrl(API_BASE_URL)
        session.headers.update({'Authorization': f'Bearer {token}'})
        session.headers.update({'Content-type': 'application/json; charset=utf8'})

        return session
    except Exception as e:
        print(e)
        raise Exception('Pole Emploi API - Problem initializing API')
