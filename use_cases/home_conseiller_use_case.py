from datetime import datetime

from model.action import Action
from model.home_conseiller import HomeConseiller
from model.jeune_actions_sum_up import JeuneActionsSumUp
from repositories.action_repository import ActionRepository
from repositories.conseiller_repository import ConseillerRepository
from repositories.jeune_repository import JeuneRepository
from use_cases.create_action_request import CreateActionRequest


class HomeConseillerUseCase:

    def __init__(
            self,
            jeune_repository: JeuneRepository,
            conseiller_repository: ConseillerRepository,
            action_repository: ActionRepository
    ):
        self.jeuneRepository = jeune_repository
        self.conseillerRepository = conseiller_repository
        self.actionRepository = action_repository

    def create_action(self, request: CreateActionRequest, jeune_id: str) -> None:
        jeune = self.jeuneRepository.get_jeune(jeune_id)
        action = Action(
            content=request.content,
            comment=request.comment,
            is_done=request.isDone,
            creation_date=datetime.utcnow(),
            last_update=datetime.utcnow(),
            jeune=jeune
        )
        self.actionRepository.add_action(action)

    def get_jeune_actions(self, jeune_id: str) -> HomeConseiller:
        jeune = self.jeuneRepository.get_jeune(jeune_id)
        actions = self.actionRepository.get_actions(jeune)
        return HomeConseiller(actions, jeune)

    def get_jeune_actions_sum_up(self, conseiller_id: str) -> [JeuneActionsSumUp]:
        return self.actionRepository.get_actions_sum_up_for_home_conseiller(conseiller_id)

    def get_mocked_jeune_actions(self, jeune_id: str) -> HomeConseiller:
        self.jeuneRepository.create_mocked_jeune(jeune_id)
        jeune = self.jeuneRepository.get_jeune(jeune_id)
        actions = self.actionRepository.get_actions(jeune)
        return HomeConseiller(actions, jeune)
