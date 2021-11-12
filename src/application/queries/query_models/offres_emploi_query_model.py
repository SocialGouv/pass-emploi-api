class OffresEmploiQueryModel:
    def __init__(
            self,
            pagination: dict,
            results: list
    ):
        self.pagination = pagination
        self.results = results
