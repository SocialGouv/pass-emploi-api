from unittest import mock
from unittest.mock import MagicMock

from src.application.queries.get_liste_offres_emploi_query_handler import GetListeOffresEmploiQueryHandler, \
    GetListeOffresEmploiQuery
from src.application.queries.query_models.offres_emploi_query_model import OffresEmploiQueryModel


@mock.patch('src.application.repositories.offres_emploi_repository.OffresEmploiRepository')
class TestOffresEmploiUseCase:
    def test_get_offres_emploi_query_handler_returns_query_model(
            self, mocked_offres_emploi_repository
    ):
        # given
        mocked_query_model = OffresEmploiQueryModel({}, [])
        mocked_offres_emploi_repository.get_offres_emploi_query_model = MagicMock(return_value=mocked_query_model)

        handler = GetListeOffresEmploiQueryHandler(mocked_offres_emploi_repository)

        # when
        received_offres_emploi = handler.handle(GetListeOffresEmploiQuery(1, 50, None, None))

        # then
        assert received_offres_emploi == mocked_query_model
        mocked_offres_emploi_repository.get_offres_emploi_query_model.assert_called_with(1, 50, None, None)
