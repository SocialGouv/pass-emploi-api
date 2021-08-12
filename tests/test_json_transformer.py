from datetime import datetime

from json_model.json_transformer import to_json
from models.action import Action
from models.conseiller import Conseiller
from models.home import Home
from models.jeune import Jeune


def test_to_json():
    # Given
    conseiller = Conseiller('1', 'Nils', 'Tavernier')
    jeune = Jeune("ID_JEUNE", 'Kevin', 'DeBruyne', conseiller)
    home = Home([
        Action(1, "Suivre une formation", False, datetime(2020, 1, 30), datetime(2021, 10, 2),  jeune),
        Action(2, "Faire son CV", True, datetime(2021, 10, 2), datetime(2021, 10, 2), jeune),
    ], conseiller)

    # When
    json_home = to_json(home)

    # Then
    assert json_home['actions'][0]["id"] == 1
    assert json_home['actions'][0]["content"] == "Suivre une formation"
    assert not json_home['actions'][0]["isDone"]
    assert json_home['actions'][0]["creationDate"] == datetime(2020, 1, 30)

    assert json_home['actions'][1]["id"] == 2
    assert json_home['actions'][1]["content"] == "Faire son CV"
    assert json_home['actions'][1]["isDone"]
    assert json_home['actions'][1]["creationDate"] == datetime(2021, 10, 2)
