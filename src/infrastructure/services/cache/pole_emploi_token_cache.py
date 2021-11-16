from typing import Optional

from src.infrastructure.services.cache.redis_client import RedisClient

KEY = 'pole_emploi_token'
TOKEN_EXPIRY = 1440


class PoleEmploiTokenCache:
    def __init__(self, client: RedisClient):
        self.cache_client = client

    def get(self) -> Optional[str]:
        return self.cache_client.get(KEY)

    def set(self, value):
        self.cache_client.set(KEY, value, TOKEN_EXPIRY)
