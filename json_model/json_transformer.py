from json_model.json_action import JsonAction
from json_model.json_conseiller import JsonConseiller
from json_model.json_conseiller_informations import JsonConseillerInformations
from json_model.json_home_conseiller import JsonHomeConseiller
from json_model.json_home_jeune import JsonHomeJeune
from json_model.json_jeune import JsonJeune
from json_model.json_jeune_informations import JsonJeuneInformations
from json_model.json_jeune_rendezvous import JsonJeuneRendezvous
from model.conseiller_informations import ConseillerInformations
from model.home_conseiller import HomeConseiller
from model.home_jeune import HomeJeune


def to_json(object_to_jsonify):

    if type(object_to_jsonify) is HomeJeune:
        actions_list = list(map(lambda x: JsonAction(x).__dict__, object_to_jsonify.actions))
        rendezvous_list = list(map(lambda x: JsonJeuneRendezvous(x).__dict__, object_to_jsonify.rendezvous))
        return JsonHomeJeune(
            actions_list,
            object_to_jsonify.doneActionsCount,
            JsonConseiller(object_to_jsonify.conseiller).__dict__,
            rendezvous_list
        ).__dict__

    if type(object_to_jsonify) is HomeConseiller:
        actions_list = list(map(lambda x: JsonAction(x).__dict__, object_to_jsonify.actions))
        return JsonHomeConseiller(actions_list, JsonJeune(object_to_jsonify.jeune).__dict__).__dict__

    if type(object_to_jsonify) is ConseillerInformations:
        jeunes_list = list(map(lambda x: JsonJeuneInformations(x).__dict__, object_to_jsonify.jeunes))
        return JsonConseillerInformations(JsonConseiller(object_to_jsonify.conseiller).__dict__, jeunes_list).__dict__
