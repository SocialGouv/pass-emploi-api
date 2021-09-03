from datetime import datetime, timedelta

from json_model.json_transformer import to_json
from model.action import Action
from model.conseiller import Conseiller
from model.home_jeune import HomeJeune
from model.jeune import Jeune
from model.rendezvous import Rendezvous


def test_to_json():
    # Given
    conseiller = Conseiller('1', 'Nils', 'Tavernier')
    jeune = Jeune("ID_JEUNE", 'Kevin', 'DeBruyne', conseiller)
    actions = [
        Action('1', "Suivre une formation", 'commentaire1', False, datetime(2020, 1, 30), datetime(2021, 10, 2), jeune),
        Action('2', "Faire son CV", 'commentaire2', True, datetime(2021, 10, 2), datetime(2021, 10, 2), jeune),
    ]
    rendezvous = [
        Rendezvous('1', 'Rendez-vous conseiller', 'avec Nils', 'Suivi des actions', datetime(2020, 2, 1, 16),
                   timedelta(minutes=60), jeune, conseiller, 'Par tel'),
        Rendezvous('2', 'Rendez-vous conseiller', 'avec Nils', 'Atelier préparation CV', datetime(2020, 2, 8, 8),
                   timedelta(minutes=30), jeune, conseiller, 'En visio')
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
