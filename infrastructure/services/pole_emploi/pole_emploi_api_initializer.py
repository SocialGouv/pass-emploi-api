import os

from infrastructure.services.pole_emploi.pole_emploi_api_token_retriever import PoleEmploiAPITokenRetriever
from infrastructure.services.utils.requests_session_base_url import SessionWithBaseUrl

API_BASE_URL = os.environ.get('POLE_EMPLOI_API_BASE_URL')


class PoleEmploiApiInitializer:
    def __init__(self, token_retriever: PoleEmploiAPITokenRetriever):
        self.tokenRetriever = token_retriever

    def init_api(self):
        try:
            token = self.tokenRetriever.get_api_token()

            if not token:
                raise Exception('Bad token')

            session = SessionWithBaseUrl(API_BASE_URL)
            session.headers.update({'Authorization': f'Bearer {token}'})

            return session
        except Exception as err:
            print(err)
            print('Pole Emploi API - Problem initializing API')
            raise
