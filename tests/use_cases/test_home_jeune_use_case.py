from datetime import datetime
from unittest import mock
from unittest.mock import MagicMock

from freezegun.api import FakeDatetime

from model.action import Action
from model.action_creator import ActionCreator
from model.action_creator_type import ActionCreatorType
from model.action_status import ActionStatus
from model.conseiller import Conseiller
from model.jeune import Jeune
from model.rendezvous import Rendezvous
from use_cases.create_action_request import CreateActionRequest
from use_cases.home_jeune_use_case import HomeJeuneUseCase


@mock.patch('repositories.jeune_repository.JeuneRepository')
@mock.patch('repositories.action_repository.ActionRepository')
@mock.patch('repositories.rendezvous_repository.RendezvousRepository')
class TestHomeJeuneUseCase:

    def test_create_action_should_add_action_in_database(self, mocked_action_repository, mocked_jeune_repository):
        # given
        mocked_jeune_id = "1"
        mocked_conseiller = Conseiller("A", "F", "L")
        mocked_jeune = Jeune(
            mocked_jeune_id,
            "F",
            "L",
            datetime(2020, 5, 10),
            'firebase_token',
            datetime.utcnow(),
            mocked_conseiller
        )
        status = ActionStatus.NOT_STARTED
        mocked_jeune_repository.get_jeune = MagicMock(return_value=mocked_jeune)
        mocked_request = CreateActionRequest(
            comment='comment',
            content='content',
            is_done=False,
            status=status
        )

        mocked_action_creator = ActionCreator(mocked_jeune_id, ActionCreatorType.JEUNE)
        expected_action = Action(
            mocked_request.content, mocked_request.comment, mocked_request.isDone, True, FakeDatetime(2021, 10, 19),
            None, FakeDatetime(2021, 10, 19), status, mocked_jeune, mocked_action_creator
        )

        use_case = HomeJeuneUseCase(mocked_jeune_repository, mocked_action_repository)

        # when
        use_case.create_action(request=mocked_request, jeune_id=mocked_jeune_id)

        # then
        mocked_action_repository.add_action.assert_called_once()

        actual_action = mocked_action_repository.add_action.call_args[0][0]
        assert actual_action.content == expected_action.content
        assert actual_action.comment == expected_action.comment
        assert actual_action.isDone == expected_action.isDone
        assert actual_action.limitDate == expected_action.limitDate
        assert actual_action.creationDate == expected_action.creationDate
        assert actual_action.lastUpdate == expected_action.lastUpdate
        assert actual_action.status == expected_action.status
        assert actual_action.jeune == expected_action.jeune
        assert actual_action.actionCreator.creatorId == expected_action.actionCreator.creatorId
        assert actual_action.actionCreator.creatorType == expected_action.actionCreator.creatorType

    def test_get_home_when_multiple_actions_should_only_return_two_most_recent_todo_ones(
            self,
            jeune_repository,
            action_repository,
            rendezvous_repository
    ):
        # Given
        conseiller = Conseiller("A", "F", "L")
        jeune = Jeune("1", "F", "L", datetime(2020, 5, 10), 'firebase_token', datetime.utcnow(), conseiller)
        status = ActionStatus.IN_PROGRESS
        creator_type = ActionCreatorType.CONSEILLER
        action_creator = ActionCreator('1', creator_type, 1)

        action1 = Action(
            "Content1", "Comment1", False, True, datetime(2020, 5, 17), datetime(2020, 5, 30),
            datetime(2020, 5, 20), status, jeune, action_creator
        )

        action2 = Action(
            "Content2", "Comment2", False, True, datetime(2020, 5, 17), datetime(2020, 5, 30),
            datetime(2020, 5, 21), status, jeune, action_creator
        )

        action3 = Action(
            "Content3", "Comment3", False, True, datetime(2020, 5, 17), datetime(2020, 5, 30),
            datetime(2020, 5, 19), status, jeune, action_creator
        )

        action4 = Action(
            "Content4", "Comment3", True, True, datetime(2020, 5, 17), datetime(2020, 5, 30),
            datetime(2020, 5, 17), status, jeune, action_creator
        )

        actions = [action1, action2, action3, action4]
        use_case = get_home_use_case(jeune, actions, action_repository, jeune_repository, rendezvous_repository)

        # When
        home = use_case.get_home("1")

        # Then
        assert home.actions == [action2, action1]
        assert home.doneActionsCount == 1

    def test_get_home_when_less_than_two_actions_should_only_return_all_todo_ones(
            self,
            jeune_repository,
            action_repository,
            rendezvous_repository
    ):
        # Given
        conseiller = Conseiller("A", "F", "L")
        jeune = Jeune("1", "F", "L", datetime(2020, 5, 10), 'firebase_token', datetime.utcnow(), conseiller)
        status = ActionStatus.IN_PROGRESS
        creator_type = ActionCreatorType.CONSEILLER
        action_creator = ActionCreator('1', creator_type, 1)

        action1 = Action(
            "Content1", "Comment1", True, True, datetime(2020, 5, 17), datetime(2020, 5, 30),
            datetime(2020, 5, 20), status, jeune, action_creator
        )
        action2 = Action(
            "Content2", "Comment2", False, True, datetime(2020, 5, 17), datetime(2020, 5, 29),
            datetime(2020, 5, 21), status, jeune, action_creator
        )
        actions = [action1, action2]
        use_case = get_home_use_case(jeune, actions, action_repository, jeune_repository, rendezvous_repository)

        # When
        home = use_case.get_home("1")

        # Then
        assert home.actions == [action2]
        assert home.doneActionsCount == 1


def get_home_use_case(jeune, actions, action_repository, jeune_repository, rendezvous_repository):
    jeune_repository.get_jeune = MagicMock(side_effect=(lambda value: jeune if value == "1" else None))
    action_repository.get_actions = MagicMock(side_effect=(lambda value: actions if value == jeune else [Action]))
    rendezvous_repository.get_jeune_rendezvous = MagicMock(return_value=[Rendezvous])
    use_case = HomeJeuneUseCase(jeune_repository, action_repository, rendezvous_repository)
    return use_case
