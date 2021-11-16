from abc import ABC, abstractmethod
from typing import Optional

from model.action import Action
from model.jeune import Jeune
from model.jeune_actions_sum_up import JeuneActionsSumUp
from src.application.queries.query_models.action_query_model import ActionQueryModel


class ActionsRepository(ABC):
    @abstractmethod
    def get_query_model(self, id_action: str) -> Optional[ActionQueryModel]:
        raise NotImplementedError

    @abstractmethod
    def get_actions(self, jeune: Jeune) -> [Action]:
        raise NotImplementedError

    @abstractmethod
    def get_actions_sum_up_for_home_conseiller(self, conseiller_id: str) -> [JeuneActionsSumUp]:
        raise NotImplementedError

    @abstractmethod
    def add_action(self, action: Action) -> None:
        raise NotImplementedError

    @abstractmethod
    def update_action(self, action_id: str, action_status: str) -> None:
        raise NotImplementedError

    @abstractmethod
    def update_action_deprecated(self, action_id: str, is_action_done: bool) -> None:
        raise NotImplementedError
