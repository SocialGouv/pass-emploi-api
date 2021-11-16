from typing import Optional

from flask import Blueprint, jsonify, request
from flask_cors import cross_origin

from initialize_use_cases import get_detail_action_query_handler, action_use_case
from json_model.json_action import JsonAction
from src.infrastructure.routes.utils.headers_logger import log_headers
from src.application.queries.query_models.action_query_model import ActionQueryModel
from src.application.queries.get_detail_action_query_handler import GetDetailActionQuery
from src.infrastructure.routes.utils.error_helpers import generate_error_response, handle_exception

actions = Blueprint('actions', __name__)


@actions.route('/actions/<id_action>', methods=['GET'])
def get_detail_action(id_action: str):
    log_headers()
    try:
        query = GetDetailActionQuery(id_action)
        action_query_model: Optional[ActionQueryModel] = get_detail_action_query_handler.handle(
            query)
        if not action_query_model:
            return generate_error_response(f'Action {id_action} not found', 404)
        return jsonify(action_query_model.__dict__), 200
    except Exception as e:
        return handle_exception(e)


@actions.route('/jeunes/<jeune_id>/actions', methods=['GET'])
def get_actions_jeune(jeune_id: str):
    log_headers()
    actions = action_use_case.get_actions(jeune_id)
    json_actions = list(map(lambda x: JsonAction(x).__dict__, actions))
    return jsonify(json_actions), 200


@actions.route('/actions/<action_id>', methods=['PATCH', 'PUT', 'POST'])
@cross_origin()
def patch_action(action_id: str):
    is_action_done = request.json.get('isDone')
    action_status = request.json.get('status')
    if is_action_done:
        action_use_case.change_action_status_deprecated(
            action_id, is_action_done)
    if action_status:
        action_use_case.change_action_status(action_id, action_status)
    return '', 200
