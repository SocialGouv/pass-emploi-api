from flask import abort, request, jsonify, Blueprint
from flask_cors import cross_origin

from initialize_use_cases import home_conseiller_use_case, rendezvous_use_case, conseiller_use_case
from json_model.json_conseiller_rendezvous import JsonConseillerRendezvous
from json_model.json_jeune import JsonJeune
from json_model.json_jeune_actions_sum_up import JsonJeuneActionsSumUp
from json_model.json_transformer import to_json
from use_cases.create_action_request import CreateActionRequest
from use_cases.create_jeune_request import CreateJeuneRequest
from use_cases.create_rendezvous_request import CreateRendezvousRequest

web = Blueprint('web', __name__)


@web.route('/conseillers/<conseiller_id>/actions', methods=['GET'])
def get_jeune_actions_sum_up(conseiller_id: str):
    sum_ups = home_conseiller_use_case.get_jeune_actions_sum_up(conseiller_id)
    json_sum_ups = list(map(lambda x: JsonJeuneActionsSumUp(x).__dict__, sum_ups))
    return jsonify(json_sum_ups), 200


@web.route('/conseillers/<conseiller_id>/jeunes/<jeune_id>/action', methods=['POST'])
@cross_origin()
def post_action(jeune_id: str):
    create_action_request = CreateActionRequest(
        request.json['comment'],
        request.json['content'],
        request.json['isDone']
    )
    home_conseiller_use_case.create_action(create_action_request, jeune_id)
    home_conseiller_use_case.send_action_notification(jeune_id)
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
    rendezvous_use_case.send_new_rendezvous_notification(request.json['jeuneId'])
    return '', 201


@web.route('/rendezvous/<rendezvous_id>', methods=['DELETE'])
@cross_origin()
def delete_rendezvous(rendezvous_id: str):
    rendezvous_use_case.delete_rendezvous(rendezvous_id)
    rendezvous_use_case.send_rendezvous_is_deleted_notification(rendezvous_id)
    return '', 200


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


@web.route('/conseillers/<conseiller_id>/jeunes/<jeune_id>/notify-message', methods=['POST'])
@cross_origin()
def notify_message(jeune_id: str, conseiller_id: str):
    if home_conseiller_use_case.check_jeune_has_correct_conseiller(conseiller_id, jeune_id):
        home_conseiller_use_case.send_message_notification(jeune_id)
    return '', 201


@web.route('/conseillers/<conseiller_id>/jeune', methods=['POST'])
@cross_origin()
def create_jeune(conseiller_id: str):
    create_jeune_request = CreateJeuneRequest(request.json['firstName'], request.json['lastName'])
    if conseiller_use_case.check_if_jeune_already_exists(create_jeune_request):
        abort(409)
    else:
        jeune = conseiller_use_case.create_jeune(create_jeune_request, conseiller_id)
        return JsonJeune(jeune).__dict__, 201
