from typing import Optional, List

from domain.offres_emploi.offre_emploi import OffreEmploi
from domain.offres_emploi.offres_emploi_repository import OffresEmploiRepository


class OffresEmploiUseCase:

    def __init__(self, offres_emploi_repository: OffresEmploiRepository):
        self.offresEmploiRepository = offres_emploi_repository

    def get_offres_emploi(self, page: int, limit: int, search_term: Optional[str], departement: Optional[str]) -> List[
        OffreEmploi]:
        offres_emploi = self.offresEmploiRepository.get_offres_emploi(page, limit, search_term, departement)
        return offres_emploi
