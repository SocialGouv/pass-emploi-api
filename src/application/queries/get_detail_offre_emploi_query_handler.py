from typing import Optional

from src.application.queries.query_handler import Query, QueryHandler
from src.application.queries.query_models.offre_emploi_query_model import OffreEmploiQueryModel
from src.application.repositories.offres_emploi_repository import OffresEmploiRepository


class GetDetailOffreEmploiQuery(Query):
    def __init__(self, id_offre: str):
        super(GetDetailOffreEmploiQuery, self).__init__(name='GetDetailOffreEmploiQuery')
        self.id_offre = id_offre


class GetDetailOffreEmploiQueryHandler(QueryHandler):
    def __init__(self, offres_emploi_repository: OffresEmploiRepository):
        self.offres_emploi_repository = offres_emploi_repository

    def handle(self, query: GetDetailOffreEmploiQuery) -> Optional[OffreEmploiQueryModel]:
        return self.offres_emploi_repository.get_offre_emploi_query_model(query.id_offre)
