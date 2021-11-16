from datetime import datetime

from src.application.repositories.actions_repository import ActionsRepository
from src.infrastructure.services.firebase.push_notification_messages import NEW_ACTION_NOTIFICATION_MESSAGE, \
    NEW_MESSAGE_NOTIFICATION_MESSAGE
from src.infrastructure.services.firebase.send_push_notifications import send_firebase_push_notifications
from model.action import Action
from model.action_creator import ActionCreator
from model.action_creator_type import ActionCreatorType
from model.action_status import ActionStatus
from model.home_conseiller import HomeConseiller
from model.jeune_actions_sum_up import JeuneActionsSumUp
from repositories.action_creator_repository import ActionCreatorRepository
from repositories.jeune_repository import JeuneRepository
from use_cases.create_action_request import CreateActionRequest


class HomeConseillerUseCase:

    def __init__(
            self, jeune_repository: JeuneRepository, action_repository: ActionsRepository,
            action_creator_repository: ActionCreatorRepository
            ):
        self.jeuneRepository = jeune_repository
        self.actionRepository = action_repository
        self.actionCreatorRepository = action_creator_repository

    def create_action(self, request: CreateActionRequest, jeune_id: str) -> None:
        jeune = self.jeuneRepository.get_jeune(jeune_id)

        self.actionCreatorRepository.add_action_creator(
            ActionCreator(
                creator_id=jeune.conseiller.id,
                action_creator_type=ActionCreatorType.CONSEILLER
                )
            )
        action_creator = self.actionCreatorRepository.get_action_creator(
            jeune.conseiller.id,
            ActionCreatorType.CONSEILLER
            )

        action = Action(
            content=request.content,
            comment=request.comment,
            is_done=request.isDone,
            is_visible_by_conseiller=True,
            creation_date=datetime.utcnow(),
            limit_date=None,
            last_update=datetime.utcnow(),
            status=ActionStatus(request.status),
            jeune=jeune,
            action_creator=action_creator
        )
        self.actionRepository.add_action(action)

    def get_jeune_actions(self, jeune_id: str) -> HomeConseiller:
        jeune = self.jeuneRepository.get_jeune(jeune_id)
        actions = self.actionRepository.get_actions(jeune)
        return HomeConseiller(actions, jeune)

    def get_jeune_actions_sum_up(self, conseiller_id: str) -> [JeuneActionsSumUp]:
        return self.actionRepository.get_actions_sum_up_for_home_conseiller(conseiller_id)

    def check_jeune_has_correct_conseiller(self, conseiller_id: str, jeune_id: str):
        jeune = self.jeuneRepository.get_jeune(jeune_id)
        return jeune is not None and jeune.conseiller.id == conseiller_id

    def send_action_notification(self, jeune_id: str):
        jeune = self.jeuneRepository.get_jeune(jeune_id)
        registration_token = jeune.firebaseToken
        if registration_token:
            try:
                send_firebase_push_notifications(registration_token, NEW_ACTION_NOTIFICATION_MESSAGE)
            except Exception as e:
                print(f'Token {registration_token}: {e} ')

    def send_message_notification(self, jeune_id: str):
        jeune = self.jeuneRepository.get_jeune(jeune_id)
        registration_token = jeune.firebaseToken
        send_firebase_push_notifications(registration_token, NEW_MESSAGE_NOTIFICATION_MESSAGE)
