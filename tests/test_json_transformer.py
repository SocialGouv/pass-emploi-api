from datetime import datetime, timedelta

from json_model.json_transformer import to_json
from model.action import Action
from model.action_creator import ActionCreator
from model.action_creator_type import ActionCreatorType
from model.action_status import ActionStatus
from model.conseiller import Conseiller
from model.home_jeune import HomeJeune
from model.jeune import Jeune
from model.rendezvous import Rendezvous


def test_to_json():
    # Given
    conseiller = Conseiller('1', 'Nils', 'Tavernier')
    jeune = Jeune("ID_JEUNE", 'Kevin', 'DeBruyne', datetime(2020, 5, 10), 'firebase_token', datetime.utcnow(),
                  conseiller)
    action_creator = ActionCreator('3', '1', ActionCreatorType.CONSEILLER)

    actions = [
        Action(
            id='1',
            content="Suivre une formation",
            comment='commentaire1',
            is_done=False,
            is_visible_by_conseiller=True,
            creation_date=datetime(2020, 1, 30),
            limit_date=datetime(2021, 11, 1),
            last_update=datetime(2021, 10, 2),
            status=ActionStatus.IN_PROGRESS,
            jeune=jeune,
            action_creator=action_creator
        ),
        Action(
            id='2',
            content="Faire son CV",
            comment='commentaire2',
            is_done=True,
            is_visible_by_conseiller=False,
            creation_date=datetime(2021, 10, 2),
            limit_date=datetime(2021, 11, 1),
            last_update=datetime(2021, 10, 2),
            status=ActionStatus.IN_PROGRESS,
            jeune=jeune,
            action_creator=action_creator
        ),
    ]
    rendezvous = [
        Rendezvous(
            id='1',
            title='Rendez-vous conseiller',
            subtitle='avec Nils',
            comment='Suivi des actions',
            modality='Par tel',
            date=datetime(2020, 2, 1, 16),
            duration=timedelta(minutes=60),
            is_soft_deleted=False,
            jeune=jeune,
            conseiller=conseiller,
        ),
        Rendezvous(
            id='2',
            title='Rendez-vous conseiller',
            subtitle='avec Nils',
            comment='Atelier préparation CV',
            modality='En visio',
            date=datetime(2020, 2, 8, 8),
            duration=timedelta(minutes=30),
            is_soft_deleted=False,
            jeune=jeune,
            conseiller=conseiller,
        )
    ]
    home = HomeJeune(actions, 3, conseiller, rendezvous)

    # When
    json_home = to_json(home)

    # Then
    assert json_home['actions'][0]["id"] == '1'
    assert json_home['actions'][0]["content"] == "Suivre une formation"
    assert json_home['actions'][0]["comment"] == "commentaire1"
    assert not json_home['actions'][0]["isDone"]
    assert json_home['actions'][0]["creationDate"] == datetime(2020, 1, 30)

    assert json_home['actions'][1]["id"] == '2'
    assert json_home['actions'][1]["content"] == "Faire son CV"
    assert json_home['actions'][1]["comment"] == "commentaire2"
    assert json_home['actions'][1]["isDone"]
    assert json_home['actions'][1]["creationDate"] == datetime(2021, 10, 2)

    assert json_home['doneActionsCount'] == 3

    assert json_home['rendezvous'][0]["id"] == "1"
    assert json_home['rendezvous'][0]["title"] == "Rendez-vous conseiller"
    assert json_home['rendezvous'][0]["subtitle"] == "avec Nils"
    assert json_home['rendezvous'][0]["comment"] == "Suivi des actions"
    assert json_home['rendezvous'][0]["date"] == datetime(2020, 2, 1, 16)
    assert json_home['rendezvous'][0]["duration"] == '1:00:00'
    assert json_home['rendezvous'][0]["modality"] == 'Par tel'

    assert json_home['rendezvous'][1]["id"] == "2"
    assert json_home['rendezvous'][1]["title"] == "Rendez-vous conseiller"
    assert json_home['rendezvous'][1]["subtitle"] == "avec Nils"
    assert json_home['rendezvous'][1]["comment"] == "Atelier préparation CV"
    assert json_home['rendezvous'][1]["date"] == datetime(2020, 2, 8, 8)
    assert json_home['rendezvous'][1]["duration"] == '0:30:00'
    assert json_home['rendezvous'][1]["modality"] == 'En visio'
