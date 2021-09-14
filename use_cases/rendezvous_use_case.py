from datetime import datetime, timedelta

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

    def get_conseiller_rendezvous_deprecated(self) -> [Rendezvous]:
        conseiller = self.conseillerRepository.get_random_conseiller()
        return self.rendezvousRepository.get_conseiller_rendezvous_deprecated(conseiller)

    def get_conseiller_rendezvous(self, conseiller_id: str) -> [Rendezvous]:
        return self.rendezvousRepository.get_conseiller_rendezvous(conseiller_id)

    def create_rendezvous(self, request: CreateRendezvousRequest) -> None:
        jeune = self.jeuneRepository.get_jeune(request.jeuneId)
        conseiller = self.conseillerRepository.get_conseiller(request.conseillerId)
        duration_as_datetime = datetime.strptime(request.duration, "%H:%M:%S")
        rendezvous = Rendezvous(
            title='Rendez-vous conseiller',
            subtitle='avec ' + conseiller.firstName,
            comment=request.comment,
            modality=request.modality,
            date=datetime.strptime(request.date, "%a, %d %b %Y %H:%M:%S %Z"),
            duration=timedelta(
                hours=duration_as_datetime.hour,
                minutes=duration_as_datetime.minute,
                seconds=duration_as_datetime.second
            ),
            jeune=jeune,
            conseiller=conseiller
        )
        self.rendezvousRepository.add_rendezvous(rendezvous)
