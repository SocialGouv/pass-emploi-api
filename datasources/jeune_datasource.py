from models.jeune import Jeune


class JeuneDatasource:
    jeunes = []

    def exists(self, jeune_id: str):
        return any(jeune.id == jeune_id for jeune in self.jeunes)

    def create_jeune(self, jeune: Jeune):
        self.jeunes.append(jeune)

    def get(self, jeune_id: str):
        for jeune in self.jeunes:
            if jeune.id == jeune_id:
                return jeune
        return None

    def get_jeunes_list(self):
        return self.jeunes
