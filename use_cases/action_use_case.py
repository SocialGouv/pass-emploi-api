from model.action_status import ActionStatus
from repositories.action_repository import ActionRepository
from repositories.jeune_repository import JeuneRepository


class ActionUseCase:
    def __init__(self, jeune_repository: JeuneRepository, action_repository: ActionRepository):
        self.jeuneRepository = jeune_repository
        self.actionRepository = action_repository

    def get_actions(self, jeune_id: str):
        jeune = self.jeuneRepository.get_jeune(jeune_id)
        return self.actionRepository.get_actions(jeune)

    def change_action_status(self, action_id: str, action_status: str):
        if action_status in [e.value for e in ActionStatus]:
            self.actionRepository.update_action(action_id, action_status)

    def change_action_status_deprecated(self, action_id: str, is_action_done: bool):
        self.actionRepository.update_action_deprecated(action_id, is_action_done)
