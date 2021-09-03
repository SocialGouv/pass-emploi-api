from model.action import Action
from sql_model.sql_action import SqlAction
from transformers.jeune_transformer import to_jeune


def to_action(sql_action: SqlAction) -> Action:
    return Action(
        str(sql_action.id),
        sql_action.content,
        sql_action.comment,
        sql_action.isDone,
        sql_action.creationDate,
        sql_action.lastUpdate,
        to_jeune(sql_action.jeune)
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
