from model.action import Action
from sql_model.sql_action import SqlAction
from transformers.jeune_transformer import to_jeune


def to_action(sql_action: SqlAction) -> Action:
    return Action(
        id=str(sql_action.id),
        content=sql_action.content,
        comment=sql_action.comment,
        is_done=sql_action.isDone,
        creation_date=sql_action.creationDate,
        last_update=sql_action.lastUpdate,
        jeune=to_jeune(sql_action.jeune)
    )


def to_sql_action(action: Action) -> SqlAction:
    return SqlAction(
        content=action.content,
        comment=action.comment,
        isDone=action.isDone,
        creationDate=action.creationDate,
        lastUpdate=action.lastUpdate,
        jeuneId=action.jeune.id
    )
