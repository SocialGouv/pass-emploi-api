from json_model.json_action import JsonAction
from json_model.json_conseiller import JsonConseiller
from json_model.json_home_conseiller import JsonHomeConseiller
from json_model.json_home_jeune import JsonHomeJeune
from json_model.json_jeune import JsonJeune
from models.home_conseiller import HomeConseiller
from models.home_jeune import HomeJeune


def to_json(home):
    if type(home) is HomeJeune:
        actions_list = list(map(lambda x: JsonAction(x).__dict__, home.actions))
        return JsonHomeJeune(actions_list, JsonConseiller(home.conseiller).__dict__).__dict__
    if type(home) is HomeConseiller:
        actions_list = list(map(lambda x: JsonAction(x).__dict__, home.actions))
        return JsonHomeConseiller(actions_list, JsonJeune(home.jeune).__dict__).__dict__
