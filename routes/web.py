from flask import request, jsonify, Blueprint
from flask_cors import cross_origin

from initialize_app import IS_DEV
from initialize_use_cases import home_conseiller_use_case, rendezvous_use_case, conseiller_use_case
from json_model.json_jeune import JsonJeune
from json_model.json_rendezvous import JsonRendezvous
from json_model.json_transformer import to_json
from use_cases.create_action_request import CreateActionRequest
from use_cases.create_rendezvous_request import CreateRendezvousRequest

web = Blueprint('web', __name__)


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


@web.route('/conseiller/rendezvous', methods=['GET'])
def get_rendezvous():
    rendezvous = rendezvous_use_case.get_conseiller_rendezvous()
    json_rendez_vous = list(map(lambda x: JsonRendezvous(x).__dict__, rendezvous))
    return jsonify(json_rendez_vous), 200


@web.route('/conseiller/jeunes/<jeune_id>/actions', methods=['GET'])
def get_home_conseiller(jeune_id: str):
    home_conseiller = home_conseiller_use_case.get_mocked_jeune_actions(jeune_id) if IS_DEV \
        else home_conseiller_use_case.get_jeune_actions(jeune_id)
    return to_json(home_conseiller), 200


@web.route('/conseiller/jeunes', methods=['GET'])
@cross_origin()
def get_jeunes():
    jeunes = conseiller_use_case.get_jeunes()
    json_jeunes = list(map(lambda x: JsonJeune(x).__dict__, jeunes))
    return jsonify(json_jeunes), 200
