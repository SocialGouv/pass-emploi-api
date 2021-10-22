from model.action import Action
from sql_model.sql_action import SqlAction
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
        # pareil que le com suivant
        jeuneId=action.jeune.id,
        # il est préférable d'envoyer en parametre actionCreator plutot qu'il soit un élément de action, comme ça on est sur qu'on a bien pris ça en compte en voyant les params passés
        actionCreatorId=action.actionCreator.id
    )
