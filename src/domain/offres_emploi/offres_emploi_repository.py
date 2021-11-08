from abc import ABC, abstractmethod
from typing import Optional, List

from src.domain.offres_emploi.offre_emploi import OffreEmploi


class OffresEmploiRepository(ABC):
    @abstractmethod
    def get_offres_emploi(self, page: int, limit: int, search_term: Optional[str], departement: Optional[str]) -> List[
        OffreEmploi]:
        pass
