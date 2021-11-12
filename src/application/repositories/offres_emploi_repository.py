from abc import ABC, abstractmethod
from typing import Optional

from src.application.queries.query_models.offre_emploi_query_model import OffreEmploiQueryModel
from src.application.queries.query_models.offres_emploi_query_model import OffresEmploiQueryModel


class OffresEmploiRepository(ABC):
    @abstractmethod
    def get_offres_emploi_query_model(
            self,
            page: int,
            limit: int,
            search_term: Optional[str],
            departement: Optional[str]
    ) -> OffresEmploiQueryModel:
        raise NotImplementedError

    @abstractmethod
    def get_offre_emploi_query_model(selfself, id_offre: str) -> Optional[OffreEmploiQueryModel]:
        raise NotImplementedError
