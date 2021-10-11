from datetime import datetime
from unittest import mock
from unittest.mock import MagicMock

from freezegun import freeze_time
from freezegun.api import FakeDatetime

from model.conseiller import Conseiller
from model.jeune import Jeune
from use_cases.rendezvous_use_case import RendezvousUseCase
from firebase.send_push_notifications import send_firebase_push_notifications


@mock.patch('repositories.jeune_repository.JeuneRepository')
@mock.patch('repositories.conseiller_repository.ConseillerRepository')
@mock.patch('repositories.rendezvous_repository.RendezvousRepository')
@mock.patch('model.rendezvous.Rendezvous')
@mock.patch('use_cases.rendezvous_use_case.send_firebase_push_notifications')
@freeze_time('2021-01-02')
class TestRendezvousUseCase:
    def test_get_jeune_rendezvous_returns_only_non_deleted_rendezvous(self, jeune_repository,
                                                                      conseiller_repository,
                                                                      rendezvous_repository,
                                                                      mocked_rendezvous):
        # given
        conseiller = Conseiller("A", "F", "L")
        jeune = Jeune("1", "F", "L", datetime(2021, 1, 2), '', datetime.utcnow(), conseiller)

        jeune_repository.get_jeune = MagicMock(return_value=jeune)
        rendezvous_repository.get_jeune_rendezvous = MagicMock(return_value=[mocked_rendezvous])
        use_case = RendezvousUseCase(jeune_repository, conseiller_repository, rendezvous_repository)

        # when
        rendezvous = use_case.get_jeune_rendezvous(jeune_id='1')

        # then
        assert rendezvous == [mocked_rendezvous]
        rendezvous_repository.get_jeune_rendezvous.assert_called_with(jeune,
                                                                      rendezvous_limit_date=FakeDatetime(2021, 1, 2),
                                                                      is_soft_deleted=False)

    def test_get_conseiller_rendezvous_returns_only_non_deleted_rendezvous(self, jeune_repository,
                                                                           conseiller_repository,
                                                                           rendezvous_repository,
                                                                           mocked_rendezvous):
        # given
        rendezvous_repository.get_conseiller_rendezvous = MagicMock(return_value=[mocked_rendezvous])
        use_case = RendezvousUseCase(jeune_repository, conseiller_repository, rendezvous_repository)

        # when
        rendezvous = use_case.get_conseiller_rendezvous(conseiller_id='A')

        # then
        assert rendezvous == [mocked_rendezvous]
        rendezvous_repository.get_conseiller_rendezvous.assert_called_with('A', is_soft_deleted=False)

    def test_send_new_rendezvous_notification_should_not_send_notification_if_token_is_empty(self,
                                                                                             mocked_send_firebase_push_notifications,
                                                                                             mocked_rendezvous,
                                                                                             rendezvous_repository,
                                                                                             conseiller_repository,
                                                                                             jeune_repository):
        # given
        conseiller = Conseiller("A", "F", "L")
        jeune = Jeune("1", "F", "L", datetime(2021, 1, 2), '', datetime.utcnow(), conseiller)

        jeune_repository.get_jeune = MagicMock(return_value=jeune)
        rendezvous_repository.get_jeune_rendezvous = MagicMock(return_value=[mocked_rendezvous])

        use_case = RendezvousUseCase(jeune_repository, conseiller_repository, rendezvous_repository)

        # when
        use_case.send_new_rendezvous_notification(str(jeune.id))

        # then
        mocked_send_firebase_push_notifications.assert_not_called()

    def test_send_new_rendezvous_notification_should_not_throw_exceptions_if_firebase_crash(self,
                                                                                             mocked_send_firebase_push_notifications,
                                                                                             mocked_rendezvous,
                                                                                             rendezvous_repository,
                                                                                             conseiller_repository,
                                                                                             jeune_repository):
        # given
        conseiller = Conseiller("A", "F", "L")
        jeune = Jeune("1", "F", "L", datetime(2021, 1, 2), 'test', datetime.utcnow(), conseiller)

        jeune_repository.get_jeune = MagicMock(return_value=jeune)
        rendezvous_repository.get_jeune_rendezvous = MagicMock(return_value=[mocked_rendezvous])

        mocked_send_firebase_push_notifications.side_effect = Exception

        use_case = RendezvousUseCase(jeune_repository, conseiller_repository, rendezvous_repository)

        # then
        try:
            use_case.send_new_rendezvous_notification(str(jeune.id))
        except Exception:
            assert False
