from unittest import mock
from unittest.mock import MagicMock

from src.application.use_cases.offres_emploi_use_case import OffresEmploiUseCase


@mock.patch('src.domain.offres_emploi.offres_emploi_repository.OffresEmploiRepository')
class TestOffresEmploiUseCase:
    def test_get_offres_emploi_returns(
            self, mocked_offres_emploi_repository
    ):
        # given
        mocked_offres_emploi = []
        mocked_offres_emploi_repository.get_offres_emploi = MagicMock(return_value=mocked_offres_emploi)

        use_case = OffresEmploiUseCase(mocked_offres_emploi_repository)

        # when
        offres_emploi = use_case.get_offres_emploi(1, 50, None, None)

        # then
        assert offres_emploi == []
        mocked_offres_emploi_repository.get_offres_emploi.assert_called_with(1, 50, None, None)
