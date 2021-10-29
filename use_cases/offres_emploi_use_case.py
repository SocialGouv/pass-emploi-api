from model.offre_emploi import OffreEmploi
from repositories.offres_emploi_repository import OffresEmploiRepository


class OffresEmploiUseCase:

    def __init__(self, offres_emploi_repository: OffresEmploiRepository):
        self.offresEmploiRepository = offres_emploi_repository

    def get_offres_emploi(self) -> [OffreEmploi]:
        offres_emploi = self.offresEmploiRepository.get_offres_emploi()

        return offres_emploi
