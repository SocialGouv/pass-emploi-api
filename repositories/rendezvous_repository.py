from datetime import datetime

from datasources.rendezvous_datasource import RendezvousDatasource
from models.conseiller import Conseiller
from models.jeune import Jeune
from models.rendezvous import Rendezvous


class RendezvousRepository:

    def __init__(self, rendezvous_datasource: RendezvousDatasource):
        self.rendezvousDatasource = rendezvous_datasource

    def get_jeune_rendezvous(self, jeune: Jeune, rendezvous_limit_date: datetime):
        return self.rendezvousDatasource.get_jeune_rendezvous(jeune, rendezvous_limit_date)

    def get_conseiller_rendezvous(self, conseiller: Conseiller, rendezvous_limit_date: datetime):
        return self.rendezvousDatasource.get_conseiller_rendezvous(conseiller, rendezvous_limit_date)

    def create_mocked_rendezvous(self, jeune: Jeune, conseiller: Conseiller):
        return self.rendezvousDatasource.create_mocked_rendezvous(jeune, conseiller)

    def add_rendezvous(self, rendezvous: Rendezvous):
        return self.rendezvousDatasource.add_rendezvous(rendezvous)
