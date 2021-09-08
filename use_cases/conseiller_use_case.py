from repositories.conseiller_repository import ConseillerRepository


class ConseillerUseCase:

    def __init__(self, conseiller_repository: ConseillerRepository):
        self.conseillerRepository = conseiller_repository

    def get_jeunes(self):
        conseiller = self.conseillerRepository.get_random_conseiller()
        return self.conseillerRepository.get_jeunes(conseiller)
