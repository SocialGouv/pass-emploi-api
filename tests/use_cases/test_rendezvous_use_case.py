from datetime import datetime, timedelta
from unittest import mock
from unittest.mock import MagicMock

from freezegun import freeze_time
from freezegun.api import FakeDatetime

from model.conseiller import Conseiller
from model.jeune import Jeune
from use_cases.create_rendezvous_request import CreateRendezvousRequest
from use_cases.rendezvous_use_case import RendezvousUseCase


@mock.patch('repositories.jeune_repository.JeuneRepository')
@mock.patch('repositories.conseiller_repository.ConseillerRepository')
@mock.patch('repositories.rendezvous_repository.RendezvousRepository')
class TestRendezvousUseCase:
    @mock.patch('model.rendezvous.Rendezvous')
    @freeze_time('2021-01-02')
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

    @mock.patch('model.rendezvous.Rendezvous')
    @freeze_time('2021-01-02')
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

    @mock.patch('model.rendezvous.Rendezvous')
    @mock.patch('use_cases.rendezvous_use_case.send_firebase_push_notifications')
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

    @mock.patch('model.rendezvous.Rendezvous')
    @mock.patch('use_cases.rendezvous_use_case.send_firebase_push_notifications')
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

    def test_create_rendezvous_should_add_rendezvous_in_database_with_correct_informations(self,
                                                                                           mocked_jeune_repository,
                                                                                           mocked_conseiller_repository,
                                                                                           mocked_rendezvous_repository):

        # given
        jeune_id = "1"
        conseiller_id = "A"
        conseiller = Conseiller(conseiller_id, "Nils", "Wilis")
        jeune = Jeune(jeune_id, "F", "L", datetime(2021, 1, 2), '', datetime.utcnow(), conseiller)

        mocked_jeune_repository.get_jeune = MagicMock(return_value=jeune)
        mocked_conseiller_repository.get_conseiller = MagicMock(return_value=conseiller)
        use_case = RendezvousUseCase(mocked_jeune_repository, mocked_conseiller_repository,
                                     mocked_rendezvous_repository)

        mocked_request = CreateRendezvousRequest(comment='comment', date="Sun, 24 Sep 2023 19:30:00 GMT", duration=61,
                                                 modality='visio', jeune_id=jeune_id, conseiller_id=conseiller_id)

        # when
        use_case.create_rendezvous(mocked_request)

        # then
        mocked_rendezvous_repository.add_rendezvous.assert_called_once()
        actual_rendezvous = mocked_rendezvous_repository.add_rendezvous.call_args[0][0]

        assert actual_rendezvous.jeune.id == jeune_id
        assert actual_rendezvous.conseiller.id == conseiller_id
        assert actual_rendezvous.title == 'Rendez-vous conseiller'
        assert actual_rendezvous.subtitle == 'avec Nils'
        assert actual_rendezvous.date == datetime(2023, 9, 24, 19, 30)
        assert actual_rendezvous.duration == timedelta(minutes=61)
        assert actual_rendezvous.comment == 'comment'
        assert actual_rendezvous.modality == 'visio'
        assert not actual_rendezvous.isSoftDeleted
