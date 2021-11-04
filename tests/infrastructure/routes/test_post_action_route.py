from freezegun import freeze_time
from freezegun.api import FakeDatetime

from config import PASS_EMPLOI_DEV_URL
from initialize_db import db
from model.action_creator_type import ActionCreatorType
from model.action_status import ActionStatus
from sql_model.sql_action import SqlAction
from sql_model.sql_action_creator import SqlActionCreator
from sql_model.sql_conseiller import SqlConseiller
from sql_model.sql_jeune import SqlJeune
from tests.conftest import clean_database


@clean_database
@freeze_time('2021-10-19')
def test_post_action(client):
    conseiller = SqlConseiller(id=1, firstName='Victor', lastName='Hugo')
    jeune = SqlJeune(id=1, firstName='Jean', lastName='Valjean', conseillerId=1)

    db.session.add(conseiller)
    db.session.add(jeune)
    db.session.commit()

    request = {
        "content": "Préparer CV",
        "comment": "Pour postuler aux offres"
    }

    response = client.post(f'{PASS_EMPLOI_DEV_URL}/conseillers/1/jeunes/1/action', json=request)

    assert response.status_code == 201

    created_action = SqlAction.query.first()
    assert created_action.jeune.id == '1'
    assert created_action.content == "Préparer CV"
    assert created_action.comment == "Pour postuler aux offres"
    assert created_action.isVisibleByConseiller
    assert not created_action.isDone
    assert created_action.limitDate is None
    assert created_action.creationDate == FakeDatetime(2021, 10, 19)
    assert created_action.status == ActionStatus(ActionStatus.NOT_STARTED)

    created_action_creator = SqlActionCreator.query.first()
    assert created_action_creator.actionCreatorType == ActionCreatorType(ActionCreatorType.CONSEILLER)
    assert created_action_creator.creatorId == '1'
