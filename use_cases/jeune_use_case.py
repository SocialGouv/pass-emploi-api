from repositories.action_repository import ActionRepository
from repositories.jeune_repository import JeuneRepository
from repositories.rendezvous_repository import RendezvousRepository
from use_cases.create_jeune_request import CreateJeuneRequest


class JeuneUseCase:
    def __init__(
            self,
            jeune_repository: JeuneRepository,
            action_repository: ActionRepository,
            rendezvous_repository: RendezvousRepository
    ):
        self.jeuneRepository = jeune_repository
        self.actionRepository = action_repository
        self.rendezvousRepository = rendezvous_repository

    def check_if_jeune_exists(self, jeune_id: str):
        return self.jeuneRepository.get_jeune(jeune_id)

    def initialise_chat_if_required(self, jeune_id: str):
        self.jeuneRepository.initialise_chat_if_required(jeune_id)

    def create_jeune_with_default_actions_and_rendezvous(self, request: CreateJeuneRequest) -> None:
        jeune = self.jeuneRepository.create_jeune(request)
        self.actionRepository.create_mocked_actions(jeune)
        self.rendezvousRepository.create_mocked_rendezvous(jeune, jeune.conseiller)
