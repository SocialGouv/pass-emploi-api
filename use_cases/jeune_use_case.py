from model.jeune import Jeune
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

    def create_jeune(self, request: CreateJeuneRequest) -> Jeune:
        return self.jeuneRepository.create_jeune(request)

    def create_jeune_with_default_actions_and_rendezvous(self, request: CreateJeuneRequest) -> None:
        jeune = self.create_jeune(request)
        self.actionRepository.create_mocked_actions(jeune)
        self.rendezvousRepository.create_mocked_rendezvous(jeune, jeune.conseiller)
