from datetime import datetime
from unittest.mock import patch, MagicMock

from freezegun import freeze_time

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
class TestHomeConseillerUseCase:
    def test_create_action_should_add_action_in_database(self, action_repository, jeune_repository):
        # given
        conseiller = Conseiller("A", "F", "L")
        jeune = Jeune("1", "F", "L", datetime(2020, 5, 10), 'firebase_token', datetime.utcnow(), conseiller)
        jeune_repository.get_jeune = MagicMock(return_value=jeune)
        request = CreateActionRequest(comment='comment', content='content', is_done=False)

        use_case = HomeConseillerUseCase(jeune_repository, action_repository)

        # when
        use_case.create_action(request=request, jeune_id="1")

        # then
        action_repository.add_action.assert_called_once()
