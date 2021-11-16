class OffreEmploiQueryModel:
    def __init__(
            self,
            id: str,
            url_redirect: str,
            data: dict
    ):
        self.id = id
        self.urlRedirectPourPostulation = url_redirect
        self.data = data
