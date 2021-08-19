import random
from datetime import datetime, timedelta

from models.conseiller import Conseiller
from models.jeune import Jeune
from models.rendezvous import Rendezvous

generic_actions_content = ["Atelier préparation CV",
                           "Atelier recherche formation",
                           "Suivi des actions",
                           "Suivi des démarches pro",
                           "Propositions de formations",
                           "Préparation aux entretiens"
                           ]


class RendezvousDatasource:
    rendezvous = []

    def get_rendezvous(self, jeune: Jeune, conseiller: Conseiller, rendezvous_limit_date: datetime):
        return [rv for rv in self.rendezvous if rv.jeune == jeune
                and rv.conseiller == conseiller
                and rv.date >= rendezvous_limit_date]

    def create_rendezvous(self, jeune: Jeune, conseiller: Conseiller):
        random_actions_content = generic_actions_content.copy()
        for i in range(5):
            random_action_content = random.choice(random_actions_content)
            rendezvous = Rendezvous(str(random.randint(0, 10000000)), random_action_content,
                                    datetime(2022, 12, 12), timedelta(minutes=60), jeune, conseiller, 'Par tel')
            random_actions_content.remove(random_action_content)
            self.rendezvous.append(rendezvous)
        return self.rendezvous
