from typing import Optional

from model.action import Action
from model.action_creator_type import ActionCreatorType
from sql_model.sql_action import SqlAction
from src.application.queries.query_models.action_query_model import ActionQueryModel
from transformers.action_creator_transformer import to_action_creator
from transformers.jeune_transformer import to_jeune


def to_action(sql_action: SqlAction) -> Action:
    return Action(
        id=str(sql_action.id),
        content=sql_action.content,
        comment=sql_action.comment,
        is_done=sql_action.isDone,
        is_visible_by_conseiller=sql_action.isVisibleByConseiller,
        creation_date=sql_action.creationDate,
        limit_date=sql_action.limitDate,
        last_update=sql_action.lastUpdate,
        status=sql_action.status,
        jeune=to_jeune(sql_action.jeune),
        action_creator=to_action_creator(sql_action.actionCreator)
    )


def to_sql_action(action: Action) -> SqlAction:
    return SqlAction(
        content=action.content,
        comment=action.comment,
        isDone=action.isDone,
        isVisibleByConseiller=action.isVisibleByConseiller,
        creationDate=action.creationDate,
        limitDate=action.limitDate,
        lastUpdate=action.lastUpdate,
        status=action.status.value,
        jeuneId=action.jeune.id,
        actionCreatorId=action.actionCreator.id
    )


def to_action_query_model(sql_action: Optional[SqlAction]) -> Optional[ActionQueryModel]:
    if not sql_action:
        return None
    return ActionQueryModel(
        id_action=str(sql_action.id),
        content=sql_action.content,
        comment=sql_action.comment,
        is_done=sql_action.isDone,
        creation_date=sql_action.creationDate,
        last_update=sql_action.lastUpdate,
        status=sql_action.status.value,
        creator_type=sql_action.actionCreator.actionCreatorType.value,
        creator=__parse_creator(sql_action),
        jeune_id=sql_action.jeune.id,
        jeune_firstname=sql_action.jeune.firstName,
        jeune_lastname=sql_action.jeune.lastName
    )


def __parse_creator(sql_action: SqlAction) -> str:
    if sql_action.actionCreator.actionCreatorType == ActionCreatorType.JEUNE.value:
        return f'{sql_action.jeune.firstName} {sql_action.jeune.lastName}'
    else:
        return f'{sql_action.jeune.conseiller.firstName} {sql_action.jeune.conseiller.lastName}'
