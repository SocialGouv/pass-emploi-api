from typing import Optional

from src.infrastructure.services.cache.pole_emploi_token_cache import PoleEmploiTokenCache
from src.infrastructure.services.pole_emploi.pole_emploi_api_token_retriever import PoleEmploiAPITokenRetriever


class PoleEmploiAPITokenRetrieverCacheDecorator(PoleEmploiAPITokenRetriever):
    def __init__(self, decorated: PoleEmploiAPITokenRetriever, cache: PoleEmploiTokenCache):
        self.decorated = decorated
        self.cache = cache

    def get_api_token(self) -> Optional[str]:
        cached_token = self.cache.get()
        if cached_token:
            return cached_token
        token = self.decorated.get_api_token()
        if token:
            self.cache.set(token)
        return token
