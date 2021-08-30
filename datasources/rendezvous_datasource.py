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

    def get_jeune_rendezvous(self, jeune: Jeune, rendezvous_limit_date: datetime):
        return [rv for rv in self.rendezvous if rv.jeune.id == jeune.id and rv.date >= rendezvous_limit_date]

    def get_conseiller_rendezvous(self, conseiller: Conseiller, rendezvous_limit_date: datetime):
        rendezvous = [rv for rv in self.rendezvous if rv.conseiller.id == conseiller.id
                      and rv.date >= rendezvous_limit_date]
        rendezvous.sort(key=lambda rdv: rdv.date)
        return rendezvous

    def create_mocked_rendezvous(self, jeune: Jeune, conseiller: Conseiller):
        random_actions_content = generic_actions_content.copy()
        for i in range(5):
            random_action_content = random.choice(random_actions_content)
            rendezvous = Rendezvous(str(random.randint(0, 10000000)), random_action_content, 'Rendez-vous conseiller',
                                    'avec ' + conseiller.firstName, datetime(2022, 12, 12), timedelta(minutes=60),
                                    jeune, conseiller, 'Par tel')
            random_actions_content.remove(random_action_content)
            self.rendezvous.append(rendezvous)
        return self.rendezvous

    def add_rendezvous(self, rendezvous: Rendezvous):
        self.rendezvous.append(rendezvous)
