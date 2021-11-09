from typing import Optional, List

from src.domain.offres_emploi.offre_emploi import OffreEmploi
from src.domain.offres_emploi.offres_emploi_repository import OffresEmploiRepository
from src.infrastructure.datasources.offres_emploi_api_datasource import OffresEmploiAPIDatasource
from src.infrastructure.transformers.offres_emploi_transformer import to_offres_emploi


class OffresEmploiAPIRepository(OffresEmploiRepository):

    def __init__(self, offres_emploi_datasource: OffresEmploiAPIDatasource):
        self.offresEmploiDataSource = offres_emploi_datasource

    def get_offres_emploi(self, page: int, limit: int, search_term: Optional[str], departement: Optional[str]) -> List[
        OffreEmploi]:
        offres_emploi_response = self.offresEmploiDataSource.get_offres_emploi(page, limit, search_term, departement)
        return to_offres_emploi(offres_emploi_response)
