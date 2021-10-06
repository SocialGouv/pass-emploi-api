from datetime import datetime
from unittest import mock
from unittest.mock import MagicMock

from model.action import Action
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
        jeune = Jeune("1", "F", "L", 'firebase_token', datetime.utcnow(), Conseiller("A", "F", "L"))
        action1 = Action("Content1", "Comment1", False, datetime(2020, 5, 17), datetime(2020, 5, 20), jeune)
        action2 = Action("Content2", "Comment2", False, datetime(2020, 5, 17), datetime(2020, 5, 21), jeune)
        action3 = Action("Content3", "Comment3", False, datetime(2020, 5, 17), datetime(2020, 5, 19), jeune)
        action4 = Action("Content4", "Comment3", True, datetime(2020, 5, 17), datetime(2020, 5, 17), jeune)
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
        jeune = Jeune("1", "F", "L", 'firebase_token', datetime.utcnow(), Conseiller("A", "F", "L"))
        action1 = Action("Content1", "Comment1", True, datetime(2020, 5, 17), datetime(2020, 5, 20), jeune)
        action2 = Action("Content2", "Comment2", False, datetime(2020, 5, 17), datetime(2020, 5, 21), jeune)
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
