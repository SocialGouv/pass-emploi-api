from model.action_creator import ActionCreator
from model.action_creator_type import ActionCreatorType
from sql_model.sql_action_creator import SqlActionCreator


def to_action_creator(sql_action_creator: SqlActionCreator) -> ActionCreator:
    return ActionCreator(
        id=sql_action_creator.id,
        creator_id=sql_action_creator.creatorId,
        action_creator_type=ActionCreatorType(sql_action_creator.actionCreatorType)
    )


def to_sql_action_creator(action_creator: ActionCreator) -> SqlActionCreator:
    return SqlActionCreator(
        id=action_creator.id,
        actionCreatorType=action_creator.creatorType,
        creatorId=action_creator.creatorId,
    )
