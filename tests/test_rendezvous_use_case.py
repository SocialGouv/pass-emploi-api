from datetime import datetime, timedelta
from unittest import mock
from unittest.mock import MagicMock

from freezegun.api import FakeDatetime

from model.conseiller import Conseiller
from model.jeune import Jeune
from model.rendezvous import Rendezvous
from use_cases.rendezvous_use_case import RendezvousUseCase

from freezegun import freeze_time


@mock.patch('repositories.jeune_repository.JeuneRepository')
@mock.patch('repositories.conseiller_repository.ConseillerRepository')
@mock.patch('repositories.rendezvous_repository.RendezvousRepository')
@freeze_time('2021-01-02')
class TestRendezvousUseCase:
    def test_get_jeune_rendezvous_returns_only_non_deleted_rendezvous(self, jeune_repository,
                                                                      conseiller_repository,
                                                                      rendezvous_repository):
        # given
        conseiller = Conseiller("A", "F", "L")
        jeune = Jeune("1", "F", "L", '', datetime.utcnow(), conseiller)
        expected_rendezvous = Rendezvous('test rendezvous', '', '', '', datetime(2021, 1, 5), timedelta(minutes=60),
                                         True, jeune, conseiller)

        jeune_repository.get_jeune = MagicMock(return_value=jeune)
        rendezvous_repository.get_jeune_rendezvous = MagicMock(return_value=[expected_rendezvous])
        use_case = RendezvousUseCase(jeune_repository, conseiller_repository, rendezvous_repository)

        # when
        rendezvous = use_case.get_jeune_rendezvous(jeune_id='1')

        # then
        assert rendezvous == [expected_rendezvous]
        rendezvous_repository.get_jeune_rendezvous.assert_called_with(jeune,
                                                                      rendezvous_limit_date=FakeDatetime(2021, 1, 2),
                                                                      is_soft_deleted=False)
