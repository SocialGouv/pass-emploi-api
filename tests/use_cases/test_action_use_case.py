from unittest.mock import patch

from use_cases.action_use_case import ActionUseCase


@patch('repositories.jeune_repository.JeuneRepository')
@patch('repositories.action_repository.ActionRepository')
class TestActionUseCase:
    def test_change_action_status_updates_action_given_correct_action_status(self, action_repository, jeune_repository):
        # given
        action_id = '1'
        action_status = 'in_progress'

        use_case = ActionUseCase(jeune_repository, action_repository)

        # when
        use_case.change_action_status(action_id, action_status)

        # then
        action_repository.update_action.assert_called_with('1', 'in_progress')


@patch('repositories.jeune_repository.JeuneRepository')
@patch('repositories.action_repository.ActionRepository')
class TestActionUseCase:
    def test_change_action_status_should_not_update_action_when_action_status_is_incorrect(self, action_repository,
                                                                                           jeune_repository):
        # given
        action_id = '1'
        action_status = 'false_status'

        use_case = ActionUseCase(jeune_repository, action_repository)

        # when
        use_case.change_action_status(action_id, action_status)

        # then
        assert not action_repository.update_action.called
