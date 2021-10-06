from model.conseiller_informations import ConseillerInformations
from repositories.conseiller_repository import ConseillerRepository


class ConseillerUseCase:

    def __init__(self, conseiller_repository: ConseillerRepository):
        self.conseillerRepository = conseiller_repository

    def get_conseiller_informations(self, conseiller_id):
        conseiller = self.conseillerRepository.get_conseiller(conseiller_id)
        jeunes = self.conseillerRepository.get_jeunes(conseiller_id)
        return ConseillerInformations(conseiller, jeunes)
