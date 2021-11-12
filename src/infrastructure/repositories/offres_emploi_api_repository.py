from typing import Optional

from src.application.queries.query_models.offre_emploi_query_model import OffreEmploiQueryModel
from src.application.queries.query_models.offres_emploi_query_model import OffresEmploiQueryModel
from src.application.repositories.offres_emploi_repository import OffresEmploiRepository
from src.infrastructure.datasources.offres_emploi_api_datasource import OffresEmploiAPIDatasource
from src.infrastructure.transformers.offres_emploi_transformer import to_offres_emploi_query_model, \
    to_offre_emploi_query_model


class OffresEmploiAPIRepository(OffresEmploiRepository):

    def __init__(self, offres_emploi_datasource: OffresEmploiAPIDatasource):
        self.offres_emploi_datasource = offres_emploi_datasource

    def get_offres_emploi_query_model(
            self,
            page: int,
            limit: int,
            search_term: Optional[str],
            departement: Optional[str]
    ) -> OffresEmploiQueryModel:
        offres_emploi_response = self.offres_emploi_datasource.get_offres_emploi(page, limit, search_term, departement)
        return to_offres_emploi_query_model(page, limit, offres_emploi_response)

    def get_offre_emploi_query_model(
            self,
            id_offre: str
    ) -> Optional[OffreEmploiQueryModel]:
        offre_emploi_response = self.offres_emploi_datasource.get_offre_emploi(id_offre)
        return to_offre_emploi_query_model(offre_emploi_response)
