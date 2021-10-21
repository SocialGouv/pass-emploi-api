from datetime import datetime
from unittest.mock import patch, MagicMock

from freezegun.api import FakeDatetime, freeze_time

from model.action import Action
from model.action_creator import ActionCreator
from model.action_creator_type import ActionCreatorType
from model.action_status import ActionStatus
from model.conseiller import Conseiller
from model.jeune import Jeune
from use_cases.create_action_request import CreateActionRequest
from use_cases.home_conseiller_use_case import HomeConseillerUseCase


@patch('repositories.jeune_repository.JeuneRepository')
@patch('repositories.action_repository.ActionRepository')
@freeze_time('2021-10-19')
class TestHomeConseillerUseCase:
    def test_create_action_should_add_action_in_database(self, mocked_action_repository, mocked_jeune_repository):
        # given
        conseiller = Conseiller("A", "F", "L")
        jeune = Jeune("1", "F", "L", datetime(2020, 5, 10), 'firebase_token', datetime.utcnow(), conseiller)
        mocked_jeune_repository.get_jeune = MagicMock(return_value=jeune)
        request = CreateActionRequest(comment='comment', content='content', is_done=False)

        action_creator = ActionCreator('A', ActionCreatorType.CONSEILLER)
        expected_action = Action(request.content, request.comment, request.isDone, True, FakeDatetime(2021, 10, 19),
                                 None, FakeDatetime(2021, 10, 19), ActionStatus.NOT_STARTED, jeune, action_creator)

        use_case = HomeConseillerUseCase(mocked_jeune_repository, mocked_action_repository)

        # when
        use_case.create_action(request=request, jeune_id="1")

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
