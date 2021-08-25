from repositories.conseiller_repository import ConseillerRepository


class ConseillerUseCase:

    def __init__(self, conseiller_repository: ConseillerRepository):
        self.conseillerRepository = conseiller_repository

    def get_jeunes(self):
        return self.conseillerRepository.get_jeunes()
