from datetime import datetime

from model.action import Action
from model.conseiller import Conseiller
from model.jeune import Jeune
from sql_model.sql_action import SqlAction
from sql_model.sql_conseiller import SqlConseiller
from sql_model.sql_jeune import SqlJeune
from transformers.action_transformer import to_action, to_sql_action


def test_to_action():
    # Given
    creation_date = datetime.utcnow()
    last_update = datetime.utcnow()
    sql_conseiller = SqlConseiller(id=1, firstName='Nils', lastName='Tavernier')
    sql_jeune = SqlJeune(id='2', firstName='Kendji', lastName='Girac', conseiller=sql_conseiller)
    sql_action = SqlAction(
        id=3,
        content='content',
        comment='comment',
        isDone=True,
        creationDate=creation_date,
        lastUpdate=last_update,
        jeune=sql_jeune
    )

    # When
    action = to_action(sql_action)

    # Then
    assert action.id == '3'
    assert action.content == 'content'
    assert action.comment == 'comment'
    assert action.isDone
    assert action.creationDate == creation_date
    assert action.lastUpdate == last_update
    assert action.jeune.id == '2'
    assert action.jeune.firstName == 'Kendji'
    assert action.jeune.lastName == 'Girac'
    assert action.jeune.conseiller.id == '1'
    assert action.jeune.conseiller.firstName == 'Nils'
    assert action.jeune.conseiller.lastName == 'Tavernier'


def test_to_sql_action():
    # Given
    creation_date = datetime.utcnow()
    last_update = datetime.utcnow()
    conseiller = Conseiller('1', 'Nils', 'Tavernier')
    jeune = Jeune('2', 'Kendji', 'Girac', conseiller)
    action = Action('3', 'content', 'comment', True, creation_date, last_update, jeune)

    # When
    sql_action = to_sql_action(action)

    # Then
    assert sql_action.content == 'content'
    assert sql_action.comment == 'comment'
    assert sql_action.isDone
    assert sql_action.creationDate == creation_date
    assert sql_action.lastUpdate == last_update
    assert sql_action.jeuneId == '2'
