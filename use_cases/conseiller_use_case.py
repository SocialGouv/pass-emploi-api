from model.conseiller import Conseiller
from repositories.conseiller_repository import ConseillerRepository


class ConseillerUseCase:

    def __init__(self, conseiller_repository: ConseillerRepository):
        self.conseillerRepository = conseiller_repository

    def get_jeunes(self):
        conseiller = Conseiller('1', 'Nils', 'Tavernier')
        return self.conseillerRepository.get_jeunes(conseiller)
