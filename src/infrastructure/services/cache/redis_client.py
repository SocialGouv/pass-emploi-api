import os
from typing import Optional

import redis

URL = os.environ.get('REDIS_URL')
IS_ENABLED = URL and (URL != '')


class RedisClient:

    def __init__(self):
        self.client = redis.from_url(URL, charset="utf-8", decode_responses=True) if IS_ENABLED else None

    def get(self, key: str) -> Optional[str]:
        try:
            return self.client.get(key)
        except Exception:
            return None

    def set(self, key: str, value: str, expiry=None):
        try:
            self.client.set(key, value, ex=expiry)
        except Exception:
            pass
