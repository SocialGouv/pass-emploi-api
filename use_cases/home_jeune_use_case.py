from datetime import datetime

from model.action import Action
from model.action_creator import ActionCreator
from model.action_creator_type import ActionCreatorType
from model.action_status import ActionStatus
from model.home_jeune import HomeJeune
from repositories.action_creator_repository import ActionCreatorRepository
from repositories.jeune_repository import JeuneRepository
from repositories.rendezvous_repository import RendezvousRepository
from src.application.repositories.actions_repository import ActionsRepository
from use_cases.create_action_request import CreateActionRequest


class HomeJeuneUseCase:

    def __init__(
            self,
            jeune_repository: JeuneRepository,
            action_repository: ActionsRepository,
            rendezvous_repository: RendezvousRepository,
            action_creator_repository: ActionCreatorRepository
    ):
        self.jeuneRepository = jeune_repository
        self.actionRepository = action_repository
        self.rendezvousRepository = rendezvous_repository
        self.actionCreatorRepository = action_creator_repository

    def get_home(self, jeune_id: str):
        jeune = self.jeuneRepository.get_jeune(jeune_id)
        if jeune is not None:
            actions = self.actionRepository.get_actions(jeune)
            rendezvous = self.rendezvousRepository.get_jeune_rendezvous(jeune, datetime.utcnow(), is_soft_deleted=False)
            return HomeJeune(
                get_most_recent_todo_actions(actions),
                get_done_actions_count(actions),
                jeune.conseiller,
                rendezvous
            )
        else:
            return None

    def create_action(self, request: CreateActionRequest, jeune_id: str) -> None:
        jeune = self.jeuneRepository.get_jeune(jeune_id)

        self.actionCreatorRepository.add_action_creator(ActionCreator(creator_id=jeune.id,
                                                                      action_creator_type=ActionCreatorType.JEUNE))
        action_creator = self.actionCreatorRepository.get_action_creator(jeune.id, ActionCreatorType.JEUNE)

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


def get_most_recent_todo_actions(actions):
    todo_actions = list(filter(lambda action: not action.isDone, actions))
    todo_actions.sort(key=lambda action: action.lastUpdate, reverse=True)
    most_recent_todo_actions = todo_actions[0:2]
    return most_recent_todo_actions


def get_done_actions_count(actions):
    return len(list(filter(lambda action: action.isDone, actions)))
