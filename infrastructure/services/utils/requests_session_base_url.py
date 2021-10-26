import requests


class SessionWithBaseUrl(requests.Session):
    def __init__(self, url_base=None, *args, **kwargs):
        super(SessionWithBaseUrl, self).__init__(*args, **kwargs)
        self.url_base = url_base

    def request(self, method, url, **kwargs):
        url = f'{self.url_base.rstrip("/")}/{url.lstrip("/")}'

        return super(SessionWithBaseUrl, self).request(method, url, **kwargs)
