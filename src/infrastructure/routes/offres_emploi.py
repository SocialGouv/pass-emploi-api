from flask import request, Blueprint

from initialize_use_cases import offres_emploi_use_case
from network.headers_logger import log_headers
from src.infrastructure.routes.utils.error_helpers import handle_exception
from src.infrastructure.routes.utils.request_helpers import get_int_query_param, get_string_query_param
from src.infrastructure.routes.utils.to_json import to_json

offres_emploi = Blueprint('offres_emploi', __name__)


@offres_emploi.route('/offres-emploi', methods=['GET'])
def get_offres_emploi():
    log_headers()

    try:
        page = get_int_query_param(request.args, param_name='page', default_value=1)
        limit = get_int_query_param(request.args, param_name='limit', default_value=50)
        search_term = get_string_query_param(request.args, param_name='q')
        departement = get_string_query_param(request.args, param_name='departement')

        res = offres_emploi_use_case.get_offres_emploi(page, limit, search_term, departement)

        return to_json(res), 200
    except Exception as e:
        return handle_exception(e)
