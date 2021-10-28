from infrastructure.services.cache.redis_client import RedisClient

KEY = 'pole_emploi_token'
TOKEN_EXPIRY = 1440


class PoleEmploiTokenCache:
    def __init__(self):
        self.cache = RedisClient()

    def get(self):
        return self.cache.get(KEY)

    def set(self, value):
        return self.cache.set(KEY, value, TOKEN_EXPIRY)
