from datetime import datetime, timedelta

from model.action import Action
from model.action_creator import ActionCreator
from model.action_creator_type import ActionCreatorType
from model.action_status import ActionStatus
from model.conseiller import Conseiller
from model.jeune import Jeune
from sql_model.sql_action import SqlAction
from sql_model.sql_action_creator import SqlActionCreator
from sql_model.sql_conseiller import SqlConseiller
from sql_model.sql_jeune import SqlJeune
from src.infrastructure.transformers.action_transformer import to_action, to_sql_action


def test_to_action():
    # Given
    creation_date = datetime.utcnow()
    last_update = datetime.utcnow()
    limit_date = creation_date + timedelta(days=10)
    sql_conseiller = SqlConseiller(id=1, firstName='Nils', lastName='Tavernier')
    sql_jeune = SqlJeune(id='2', firstName='Kendji', lastName='Girac', creationDate=datetime(2020, 5, 10),
                         conseiller=sql_conseiller)
    sql_action_cretor = SqlActionCreator(id=3, actionCreatorType='conseiller', creatorId='1')
    sql_action = SqlAction(
        id=3,
        content='content',
        comment='comment',
        isDone=True,
        isVisibleByConseiller=False,
        creationDate=creation_date,
        limitDate=limit_date,
        lastUpdate=last_update,
        status='not_started',
        jeune=sql_jeune,
        actionCreator=sql_action_cretor
    )

    # When
    action = to_action(sql_action)

    # Then
    assert action.id == '3'
    assert action.content == 'content'
    assert action.comment == 'comment'
    assert action.isDone
    assert not action.isVisibleByConseiller
    assert action.creationDate == creation_date
    assert action.limitDate == limit_date
    assert action.lastUpdate == last_update
    assert action.status == 'not_started'

    assert action.jeune.id == '2'
    assert action.jeune.firstName == 'Kendji'
    assert action.jeune.lastName == 'Girac'
    assert action.jeune.creationDate == datetime(2020, 5, 10)

    assert action.actionCreator.id == 3
    assert action.actionCreator.creatorType == 'conseiller'
    assert action.actionCreator.creatorId == '1'


def test_to_sql_action():
    # Given
    creation_date = datetime.utcnow()
    last_update = datetime.utcnow()
    limit_date = creation_date + timedelta(days=10)
    status = ActionStatus.IN_PROGRESS
    creator_type = ActionCreatorType.JEUNE
    action_creator = ActionCreator('3', creator_type, 2)

    conseiller = Conseiller('1', 'Nils', 'Tavernier')
    jeune = Jeune('2', 'Kendji', 'Girac', datetime(2020, 5, 10), 'firebase_token', datetime.utcnow(), conseiller)
    action = Action('content', 'comment', True, True, creation_date, limit_date, last_update, status, jeune,
                    action_creator)

    # When
    sql_action = to_sql_action(action)

    # Then
    assert sql_action.content == 'content'
    assert sql_action.comment == 'comment'
    assert sql_action.isDone
    assert sql_action.isVisibleByConseiller
    assert sql_action.creationDate == creation_date
    assert sql_action.limitDate == limit_date
    assert sql_action.lastUpdate == last_update
    assert sql_action.status == 'in_progress'
    assert sql_action.jeuneId == jeune.id
    assert sql_action.actionCreatorId == action_creator.id
