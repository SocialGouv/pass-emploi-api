from datetime import datetime

from model.action import Action
from model.home_conseiller import HomeConseiller
from repositories.action_repository import ActionRepository
from repositories.jeune_repository import JeuneRepository
from use_cases.create_action_request import CreateActionRequest


class HomeConseillerUseCase:

    def __init__(self, jeune_repository: JeuneRepository, action_repository: ActionRepository):
        self.actionRepository = action_repository
        self.jeuneRepository = jeune_repository

    def create_action(self, request: CreateActionRequest, jeune_id: str):
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

    def get_jeune_actions(self, jeune_id: str):
        jeune = self.jeuneRepository.get_jeune(jeune_id)
        actions = self.actionRepository.get_actions(jeune)
        return HomeConseiller(actions, jeune)

    def get_mocked_jeune_actions(self, jeune_id: str):
        self.jeuneRepository.create_mocked_jeune(jeune_id)
        jeune = self.jeuneRepository.get_jeune(jeune_id)
        actions = self.actionRepository.get_actions(jeune)
        return HomeConseiller(actions, jeune)
