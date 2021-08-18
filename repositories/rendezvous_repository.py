from datasources.rendezvous_datasource import RendezvousDatasource
from models.conseiller import Conseiller
from models.jeune import Jeune


class RendezvousRepository:

    def __init__(self, rendezvous_datasource: RendezvousDatasource):
        self.rendezvousDatasource = rendezvous_datasource

    def get_rendez_vous(self, jeune: Jeune, conseiller: Conseiller):
        return self.rendezvousDatasource.get_rendezvous(jeune, conseiller)
