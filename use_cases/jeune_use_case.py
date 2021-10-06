from repositories.jeune_repository import JeuneRepository


class JeuneUseCase:

    def __init__(self, jeune_repository: JeuneRepository):
        self.jeuneRepository = jeune_repository

    def check_if_jeune_exists(self, jeune_id: str):
        return self.jeuneRepository.get_jeune(jeune_id)

    def initialise_chat_if_required(self, jeune_id: str):
        self.jeuneRepository.initialise_chat_if_required(jeune_id)

    def update_firebase_notification_informations(self, jeune_id: str, registration_token: str):
        self.jeuneRepository.update_firebase_notification_informations(jeune_id, registration_token)
