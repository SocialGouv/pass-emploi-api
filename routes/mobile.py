from flask import request, abort, Blueprint
from flask_cors import cross_origin

from initialize_app import IS_DEV
from initialize_use_cases import home_jeune_use_case, jeune_use_case, home_conseiller_use_case
from json_model.json_transformer import to_json
from use_cases.create_action_request import CreateActionRequest
from use_cases.create_jeune_request import CreateJeuneRequest

mobile = Blueprint('mobile', __name__)


@mobile.route('/jeunes/<jeune_id>/home', methods=['GET'])
def get_home_jeune(jeune_id: str):
    home_jeune = home_jeune_use_case.get_home(jeune_id)
    if home_jeune is not None:
        return to_json(home_jeune), 200
    else:
        abort(404)


@mobile.route('/jeunes', methods=['POST'])
def post_jeune():
    create_jeune_request = CreateJeuneRequest(request.json['id'], request.json['firstName'], request.json['lastName'])
    if IS_DEV:
        jeune_use_case.create_jeune_with_default_actions_and_rendezvous(create_jeune_request)
    else:
        jeune_use_case.create_jeune(create_jeune_request)
    return '', 201


@mobile.route('/jeunes/<jeune_id>/action', methods=['POST'])
@cross_origin()
def post_action(jeune_id: str):
    create_action_request = CreateActionRequest(
        request.json['comment'],
        request.json['content'],
        request.json['isDone']
    )
    home_conseiller_use_case.create_action(create_action_request, jeune_id)
    return '', 201
