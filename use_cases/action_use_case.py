from repositories.action_repository import ActionRepository


class ActionUseCase:
    def __init__(self, action_repository: ActionRepository):
        self.actionRepository = action_repository

    def change_action_status(self, action_id: str, action_status: bool):
        self.actionRepository.update_action(action_id, action_status)
