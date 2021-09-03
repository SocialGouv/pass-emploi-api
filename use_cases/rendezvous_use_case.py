from datetime import datetime

from model.rendezvous import Rendezvous
from repositories.conseiller_repository import ConseillerRepository
from repositories.jeune_repository import JeuneRepository
from repositories.rendezvous_repository import RendezvousRepository
from use_cases.create_rendezvous_request import CreateRendezvousRequest


class RendezvousUseCase:
    def __init__(
            self,
            jeune_repository: JeuneRepository,
            conseiller_repository: ConseillerRepository,
            rendezvous_repository: RendezvousRepository
    ):
        self.jeuneRepository = jeune_repository
        self.conseillerRepository = conseiller_repository
        self.rendezvousRepository = rendezvous_repository

    def get_jeune_rendezvous(self, jeune_id: str) -> [Rendezvous]:
        jeune = self.jeuneRepository.get_jeune(jeune_id)
        return self.rendezvousRepository.get_jeune_rendezvous(jeune, rendezvous_limit_date=datetime.utcnow())

    def get_conseiller_rendezvous(self) -> [Rendezvous]:
        conseiller = self.conseillerRepository.get_random_conseiller()
        return self.rendezvousRepository.get_conseiller_rendezvous(conseiller, rendezvous_limit_date=datetime.utcnow())

    def create_rendezvous(self, request: CreateRendezvousRequest) -> None:
        jeune = self.jeuneRepository.get_jeune(request.jeuneId)
        rendezvous = Rendezvous(
            'id',  # TODO: remove obligation to set useless ID here
            request.title,
            request.subtitle,
            request.comment,
            request.modality,
            datetime.strptime(request.date, "%a, %d %b %Y %H:%M:%S %Z"),
            request.duration,  # TODO: fix request duration type
            jeune,
            jeune.conseiller
        )
        self.rendezvousRepository.add_rendezvous(rendezvous)
