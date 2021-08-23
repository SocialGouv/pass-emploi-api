from datetime import datetime
from random import random

from models.conseiller import Conseiller
from models.rendezvous import Rendezvous
from repositories.jeune_repository import JeuneRepository
from repositories.rendezvous_repository import RendezvousRepository
from use_cases.create_rendezvous_request import CreateRendezvousRequest


class RendezvousUseCase:
    def __init__(self, jeune_repository: JeuneRepository, rendezvous_repository: RendezvousRepository):
        self.jeuneRepository = jeune_repository
        self.rendezvousRepository = rendezvous_repository

    def get_jeune_rendezvous(self, jeune_id: str):
        jeune = self.jeuneRepository.get_jeune(jeune_id)
        return self.rendezvousRepository.get_jeune_rendezvous(jeune, rendezvous_limit_date=datetime.utcnow())

    def get_conseiller_rendezvous(self, conseiller_id: str):
        conseiller = Conseiller('1', 'Nils', 'Tavernier')
        return self.rendezvousRepository.get_conseiller_rendezvous(conseiller, rendezvous_limit_date=datetime.utcnow())

    def post_rendezvous(self, request: CreateRendezvousRequest):
        jeune = self.jeuneRepository.get_jeune(request.jeuneId)
        rendezvous = Rendezvous(str(random.randint(0, 10000000)), request.comment, request.date, request.duration,
                                jeune,
                                jeune.conseiller,
                                request.modality)
        self.rendezvousRepository.add_rendezvous(rendezvous)
