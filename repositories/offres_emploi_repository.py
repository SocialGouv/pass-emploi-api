from datasources.offres_emploi_api_datasource import OffresEmploiAPIDatasource
from transformers.offres_emploi_transformer import to_offres_emploi


class OffresEmploiRepository:

    def __init__(self, offres_emploi_datasource: OffresEmploiAPIDatasource):
        self.offresEmploiDataSource = offres_emploi_datasource

    def get_offres_emploi(self):
        offres_emploi_api_response = self.offresEmploiDataSource.get_offres_emploi()
        return to_offres_emploi(offres_emploi_api_response)
