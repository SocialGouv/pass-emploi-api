from model.conseiller_informations import ConseillerInformations
from repositories.conseiller_repository import ConseillerRepository
from repositories.jeune_repository import JeuneRepository
from use_cases.create_jeune_request import CreateJeuneRequest


class ConseillerUseCase:

    def __init__(self, conseiller_repository: ConseillerRepository, jeune_repository: JeuneRepository):
        self.conseillerRepository = conseiller_repository
        self.jeuneRepository = jeune_repository

    def get_conseiller_informations(self, conseiller_id):
        conseiller = self.conseillerRepository.get_conseiller(conseiller_id)
        jeunes = self.conseillerRepository.get_jeunes(conseiller_id)
        return ConseillerInformations(conseiller, jeunes)

    def create_jeune(self, request: CreateJeuneRequest, conseiller_id: str):
        return self.jeuneRepository.create_jeune(request, conseiller_id)

    def check_if_jeune_already_exists(self, request: CreateJeuneRequest):
        return self.jeuneRepository.check_if_jeune_already_exists(request)
