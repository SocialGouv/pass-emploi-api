from flask import jsonify, Blueprint, request
from flask_cors import cross_origin

from initialize_use_cases import action_use_case
from json_model.json_action import JsonAction
from network.headers_logger import log_headers

common_routes = Blueprint('common_routes', __name__)


@common_routes.route('/jeunes/<jeune_id>/actions', methods=['GET'])
def get_actions_jeune(jeune_id: str):
    log_headers()
    actions = action_use_case.get_actions(jeune_id)
    json_actions = list(map(lambda x: JsonAction(x).__dict__, actions))
    return jsonify(json_actions), 200


@common_routes.route('/actions/<action_id>', methods=['PATCH'])
@cross_origin()
def patch_action(action_id: str):
    log_headers()
    is_action_done = request.json.get('isDone')
    action_status = request.json.get('status')
    if is_action_done:
        action_use_case.change_action_status_deprecated(action_id, is_action_done)
    if action_status:
        action_use_case.change_action_status(action_id, action_status)
    return '', 200
