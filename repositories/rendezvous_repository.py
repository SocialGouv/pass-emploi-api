from datetime import datetime

from datasources.rendezvous_database_datasource import RendezvousDatabaseDatasource
from model.jeune import Jeune
from model.rendezvous import Rendezvous
from transformers.rendezvous_transformer import to_sql_rendezvous, to_rendezvous


class RendezvousRepository:
    def __init__(self, rendezvous_datasource: RendezvousDatabaseDatasource):
        self.rendezvousDatasource = rendezvous_datasource

    def get_jeune_rendezvous(self, jeune: Jeune, rendezvous_limit_date: datetime, is_soft_deleted: bool) -> [Rendezvous]:
        return list(
            map(
                lambda rdv: to_rendezvous(rdv),
                self.rendezvousDatasource.get_jeune_rendezvous(jeune.id, rendezvous_limit_date, is_soft_deleted)
            )
        )

    def get_conseiller_rendezvous(self, conseiller_id: str, is_soft_deleted: bool) -> [Rendezvous]:
        return list(
            map(
                lambda rdv: to_rendezvous(rdv),
                self.rendezvousDatasource.get_conseiller_rendezvous(conseiller_id, is_soft_deleted)
            )
        )

    def add_rendezvous(self, rendezvous: Rendezvous) -> None:
        self.rendezvousDatasource.add_rendezvous(to_sql_rendezvous(rendezvous))

    def delete_rendezvous(self, rendezvous_id: str):
        self.rendezvousDatasource.delete_rendezvous(rendezvous_id)
