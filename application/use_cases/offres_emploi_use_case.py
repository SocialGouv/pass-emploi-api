from typing import Optional, List

from domain.offres_emploi.offre_emploi import OffreEmploi
from domain.offres_emploi.offres_emploi_repository import OffresEmploiRepository


class OffresEmploiUseCase:

    def __init__(self, offres_emploi_repository: OffresEmploiRepository):
        self.offresEmploiRepository = offres_emploi_repository

    def get_offres_emploi(self) -> Optional[
        List[OffreEmploi]]:
        offres_emploi = self.offresEmploiRepository.get_offres_emploi()
        return offres_emploi
