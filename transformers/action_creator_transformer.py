from model.action_creator import ActionCreator
from sql_model.sql_action_creator import SqlActionCreator
from transformers.action_transformer import to_action


def to_action_creator(sql_action_creator: SqlActionCreator) -> ActionCreator:
    return ActionCreator(
        id=sql_action_creator.id,
        creator_id=sql_action_creator.creatorId,
        action_creator_type=sql_action_creator.actionCreatorType,
        action=to_action(sql_action_creator.action)
    )


def to_sql_action_creator(action_creator: ActionCreator) -> SqlActionCreator:
    return SqlActionCreator(
        actionCreatorType=action_creator.creatorType,
        creatorId=action_creator.creatorId,
        actionId=action_creator.action.id,
    )
