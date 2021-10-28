import os
import redis

url = os.environ.get('REDIS_URL')
is_enabled = url and (url is not '')


class RedisClient:

    def __init__(self):
        self.client = redis.from_url(url, charset="utf-8", decode_responses=True)

    def get(self, key: str) -> str:
        try:
            print(f'getting {key} from cache')
            return self.client.get(key)
        except Exception:
            return None

    def set(self, key: str, value: str):
        try:
            print(f'setting {key} : {value} in cache')
            return self.client.set(key, value)
        except Exception:
            return None
