from flask import request, abort, Blueprint

from infrastructure.routes.utils.to_json import to_json
from initialize_use_cases import offres_emploi_use_case
from network.headers_logger import log_headers

offres_emploi = Blueprint('offres_emploi', __name__)


@offres_emploi.route('/offres-emploi', methods=['GET'])
def get_offres_emploi():
    log_headers()

    # try:
    #     page = get_int_query_param(request, param_name='page', default_value=1)
    # except ValueError as e:
    #     abort(400, description=e)

    res = offres_emploi_use_case.get_offres_emploi()
    if res:
        return to_json(res), 200

    abort(500, description="Pole Emploi API Error")
