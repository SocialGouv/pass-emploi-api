from datetime import datetime, timedelta

from infrastructure.services.firebase.push_notification_messages import NEW_RENDEZVOUS_NOTIFICATION_MESSAGE
from infrastructure.services.firebase.send_push_notifications import send_firebase_push_notifications
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
        return self.rendezvousRepository.get_jeune_rendezvous(
            jeune, rendezvous_limit_date=datetime.utcnow(),
            is_soft_deleted=False
        )

    def get_conseiller_rendezvous(self, conseiller_id: str) -> [Rendezvous]:
        return self.rendezvousRepository.get_conseiller_rendezvous(conseiller_id, is_soft_deleted=False)

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
            is_soft_deleted=False,
            jeune=jeune,
            conseiller=conseiller
        )
        self.rendezvousRepository.add_rendezvous(rendezvous)

    def delete_rendezvous(self, rendezvous_id: str):
        self.rendezvousRepository.delete_rendezvous(rendezvous_id)

    def send_new_rendezvous_notification(self, jeune_id: str):
        jeune = self.jeuneRepository.get_jeune(jeune_id)
        registration_token = jeune.firebaseToken
        if registration_token:
            try:
                send_firebase_push_notifications(registration_token, NEW_RENDEZVOUS_NOTIFICATION_MESSAGE)
            except Exception as e:
                print(f'Token {registration_token}: {e} ')

    def send_rendezvous_is_deleted_notification(self, rendezvous_id: str):
        rendezvous = self.rendezvousRepository.get_rendezvous(rendezvous_id)
        registration_token = rendezvous.jeune.firebaseToken

        notification_message = 'Votre rendez-vous du {:02d}/{:02d} à {:02d}:{:02d} est supprimé'.format(
            rendezvous.date.day, rendezvous.date.month, rendezvous.date.hour, rendezvous.date.minute
        )

        if registration_token:
            try:
                send_firebase_push_notifications(registration_token, notification_message)
            except Exception as e:
                print(f'Token {registration_token}: {e} ')
