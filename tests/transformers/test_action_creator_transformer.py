from model.action_creator import ActionCreator
from model.action_creator_type import ActionCreatorType
from sql_model.sql_action_creator import SqlActionCreator
from transformers.action_creator_transformer import to_action_creator, to_sql_action_creator


def test_to_action_creator():
    # Given
    sql_action_cretor = SqlActionCreator(id=1, actionCreatorType='jeune', creatorId='2')

    # When
    action_creator = to_action_creator(sql_action_cretor)

    # Then
    assert action_creator.id == 1
    assert action_creator.creatorId == '2'
    assert action_creator.creatorType == 'jeune'


def test_to_sql_action_creator():
    # Given
    action_creator = ActionCreator('3', ActionCreatorType.CONSEILLER, 2)

    # When
    sql_action_creator = to_sql_action_creator(action_creator)

    # Then
    assert sql_action_creator.creatorId == '3'
    assert sql_action_creator.actionCreatorType == 'conseiller'
