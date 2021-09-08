from datetime import datetime

from datasources.rendezvous_database_datasource import RendezvousDatabaseDatasource
from model.conseiller import Conseiller
from model.jeune import Jeune
from model.rendezvous import Rendezvous
from transformers.rendezvous_transformer import to_sql_rendezvous, to_rendezvous


class RendezvousRepository:
    def __init__(self, rendezvous_datasource: RendezvousDatabaseDatasource):
        self.rendezvousDatasource = rendezvous_datasource

    def get_jeune_rendezvous(self, jeune: Jeune, rendezvous_limit_date: datetime) -> [Rendezvous]:
        return list(
            map(
                lambda rdv: to_rendezvous(rdv),
                self.rendezvousDatasource.get_jeune_rendezvous(jeune.id, rendezvous_limit_date)
            )
        )

    def get_conseiller_rendezvous(self, conseiller: Conseiller, rendezvous_limit_date: datetime) -> [Rendezvous]:
        return list(
            map(
                lambda rdv: to_rendezvous(rdv),
                self.rendezvousDatasource.get_conseiller_rendezvous(conseiller.id, rendezvous_limit_date)
            )
        )

    def create_mocked_rendezvous(self, jeune: Jeune, conseiller: Conseiller) -> None:
        self.rendezvousDatasource.create_mocked_rendezvous(jeune, conseiller)

    def add_rendezvous(self, rendezvous: Rendezvous) -> None:
        self.rendezvousDatasource.add_rendezvous(to_sql_rendezvous(rendezvous))
