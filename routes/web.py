from flask import abort, request, jsonify, Blueprint
from flask_cors import cross_origin

from initialize_use_cases import home_conseiller_use_case, rendezvous_use_case, conseiller_use_case
from json_model.json_conseiller_rendezvous import JsonConseillerRendezvous
from json_model.json_jeune_actions_sum_up import JsonJeuneActionsSumUp
from json_model.json_transformer import to_json
from use_cases.create_action_request import CreateActionRequest
from use_cases.create_rendezvous_request import CreateRendezvousRequest

web = Blueprint('web', __name__)


@web.route('/conseillers/<conseiller_id>/actions', methods=['GET'])
def get_jeune_actions_sum_up(conseiller_id: str):
    sum_ups = home_conseiller_use_case.get_jeune_actions_sum_up(conseiller_id)
    json_sum_ups = list(map(lambda x: JsonJeuneActionsSumUp(x).__dict__, sum_ups))
    return jsonify(json_sum_ups), 200


@web.route('/jeunes/<jeune_id>/action', methods=['POST'])
@cross_origin()
def post_action(jeune_id: str):
    create_action_request = CreateActionRequest(
        request.json['comment'],
        request.json['content'],
        request.json['isDone']
    )
    home_conseiller_use_case.create_action(create_action_request, jeune_id)
    return '', 201


@web.route('/conseillers/<conseiller_id>/rendezvous', methods=['POST'])
@cross_origin()
def post_rendezvous(conseiller_id: str):
    create_rendezvous_request = CreateRendezvousRequest(
        request.json['comment'],
        request.json['date'],
        request.json['duration'],
        request.json['modality'],
        request.json['jeuneId'],
        conseiller_id,
    )
    rendezvous_use_case.create_rendezvous(create_rendezvous_request)
    return '', 201


@web.route('/conseillers/<conseiller_id>/rendezvous', methods=['GET'])
def get_rendezvous(conseiller_id: str):
    rendezvous = rendezvous_use_case.get_conseiller_rendezvous(conseiller_id)
    json_rendez_vous = list(map(lambda x: JsonConseillerRendezvous(x).__dict__, rendezvous))
    return jsonify(json_rendez_vous), 200


@web.route('/conseiller/jeunes/<jeune_id>/actions', methods=['GET'])
def get_home_conseiller(jeune_id: str):
    home_conseiller = home_conseiller_use_case.get_jeune_actions(jeune_id)
    return to_json(home_conseiller), 200


@web.route('/conseillers/<conseiller_id>/login', methods=['GET'])
def get_conseiller_informations(conseiller_id: str):
    conseiller_informations = conseiller_use_case.get_conseiller_informations(conseiller_id)
    if conseiller_informations.conseiller is not None:
        return to_json(conseiller_informations), 200
    else:
        abort(401)
