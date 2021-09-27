from flask import request, abort, Blueprint
from flask_cors import cross_origin

from initialize_use_cases import home_jeune_use_case, jeune_use_case, home_conseiller_use_case
from json_model.json_jeune import JsonJeune
from json_model.json_transformer import to_json
from network.headers_logger import log_headers
from use_cases.create_action_request import CreateActionRequest

mobile = Blueprint('mobile', __name__)


@mobile.route('/jeunes/<jeune_id>/home', methods=['GET'])
def get_home_jeune(jeune_id: str):
    log_headers()
    home_jeune = home_jeune_use_case.get_home(jeune_id)
    if home_jeune is not None:
        return to_json(home_jeune), 200
    else:
        abort(404)


@mobile.route('/jeunes/<jeune_id>/login', methods=['POST'])
def jeune_login(jeune_id: str):
    log_headers()
    jeune = jeune_use_case.check_if_jeune_exists(jeune_id)
    if jeune is not None:
        jeune_use_case.initialise_chat_if_required(jeune_id)
        return JsonJeune(jeune).__dict__, 200
    else:
        abort(401)


@mobile.route('/jeunes/<jeune_id>/action', methods=['POST'])
@cross_origin()
def post_action(jeune_id: str):
    log_headers()
    create_action_request = CreateActionRequest(
        request.json['comment'],
        request.json['content'],
        request.json['isDone']
    )
    home_conseiller_use_case.create_action(create_action_request, jeune_id)
    return '', 201
