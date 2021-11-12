from typing import Optional

from src.application.queries.query_handler import Query, QueryHandler
from src.application.queries.query_models.offres_emploi_query_model import OffresEmploiQueryModel
from src.application.repositories.offres_emploi_repository import OffresEmploiRepository


class GetListeOffresEmploiQuery(Query):
    def __init__(self, page: int, limit: int, search_term: Optional[str], departement: Optional[str]):
        super(GetListeOffresEmploiQuery, self).__init__(name='GetListeOffresEmploiQuery')
        self.page = page
        self.limit = limit
        self.search_term = search_term
        self.departement = departement


class GetListeOffresEmploiQueryHandler(QueryHandler):
    def __init__(self, offres_emploi_repository: OffresEmploiRepository):
        self.offres_emploi_repository = offres_emploi_repository

    def handle(
            self,
            query: GetListeOffresEmploiQuery
    ) -> OffresEmploiQueryModel:
        return self.offres_emploi_repository.get_offres_emploi_query_model(
            query.page,
            query.limit,
            query.search_term,
            query.departement
        )
