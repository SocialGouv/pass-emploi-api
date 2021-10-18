from datetime import datetime
from unittest import mock
from unittest.mock import MagicMock

from model.action import Action
from model.action_creator import ActionCreator
from model.action_creator_type import ActionCreatorType
from model.action_status import ActionStatus
from model.conseiller import Conseiller
from model.jeune import Jeune
from model.rendezvous import Rendezvous
from use_cases.home_jeune_use_case import HomeJeuneUseCase


@mock.patch('repositories.jeune_repository.JeuneRepository')
@mock.patch('repositories.action_repository.ActionRepository')
@mock.patch('repositories.rendezvous_repository.RendezvousRepository')
class TestHomeJeuneUseCase:

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
        action_creator = ActionCreator('1', '1', creator_type)

        action1 = Action("Content1", "Comment1", False, True, datetime(2020, 5, 17), datetime(2020, 5, 30),
                         datetime(2020, 5, 20), status, jeune, action_creator)

        action2 = Action("Content2", "Comment2", False, True, datetime(2020, 5, 17), datetime(2020, 5, 30),
                         datetime(2020, 5, 21), status, jeune, action_creator)

        action3 = Action("Content3", "Comment3", False, True, datetime(2020, 5, 17), datetime(2020, 5, 30),
                         datetime(2020, 5, 19), status, jeune, action_creator)

        action4 = Action("Content4", "Comment3", True, True, datetime(2020, 5, 17), datetime(2020, 5, 30),
                         datetime(2020, 5, 17), status, jeune, action_creator)

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
        action_creator = ActionCreator('1', '1', creator_type)

        action1 = Action("Content1", "Comment1", True, True, datetime(2020, 5, 17), datetime(2020, 5, 30),
                         datetime(2020, 5, 20), status, jeune, action_creator)
        action2 = Action("Content2", "Comment2", False, True, datetime(2020, 5, 17), datetime(2020, 5, 29),
                         datetime(2020, 5, 21), status, jeune, action_creator)
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
