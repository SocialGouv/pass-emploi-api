from json_model.json_action import JsonAction
from json_model.json_conseiller import JsonConseiller
from json_model.json_home import JsonHome
from models.home import Home


def to_json(home: Home):
    actions_list = list(map(lambda x: JsonAction(x).__dict__, home.actions))
    return JsonHome(actions_list, JsonConseiller(home.conseiller).__dict__).__dict__
