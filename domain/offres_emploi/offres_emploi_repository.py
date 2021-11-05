from abc import ABC, abstractmethod
from typing import Optional, List

from domain.offres_emploi.offre_emploi import OffreEmploi


class OffresEmploiRepository(ABC):
    @abstractmethod
    def get_offres_emploi(self) -> Optional[List[OffreEmploi]]:
        pass
