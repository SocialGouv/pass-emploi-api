from datetime import datetime

from datasources.rendezvous_datasource import RendezvousDatasource
from models.conseiller import Conseiller
from models.jeune import Jeune


class RendezvousRepository:

    def __init__(self, rendezvous_datasource: RendezvousDatasource):
        self.rendezvousDatasource = rendezvous_datasource

    def get_rendezvous(self, jeune: Jeune, conseiller: Conseiller, rendezvous_limit_date: datetime):
        return self.rendezvousDatasource.get_rendezvous(jeune, conseiller, rendezvous_limit_date)

    def create_rendezvous(self, jeune: Jeune, conseiller: Conseiller):
        return self.rendezvousDatasource.create_rendezvous(jeune, conseiller)
