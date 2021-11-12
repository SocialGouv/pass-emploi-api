from flask import request, Blueprint, jsonify

from initialize_use_cases import get_liste_offres_emploi_query_handler, get_detail_offre_emploi_query_handler
from src.infrastructure.routes.utils.headers_logger import log_headers
from src.application.queries.get_detail_offre_emploi_query_handler import GetDetailOffreEmploiQuery
from src.application.queries.get_liste_offres_emploi_query_handler import GetListeOffresEmploiQuery
from src.infrastructure.routes.utils.error_helpers import handle_exception, generate_error_response
from src.infrastructure.routes.utils.request_helpers import get_int_query_param, get_string_query_param

offres_emploi = Blueprint('offres_emploi', __name__)


@offres_emploi.route('/offres-emploi', methods=['GET'])
def get_liste_offres_emploi():
    log_headers()

    try:
        page = get_int_query_param(request.args, param_name='page', default_value=1)
        limit = get_int_query_param(request.args, param_name='limit', default_value=50)
        search_term = get_string_query_param(request.args, param_name='q')
        departement = get_string_query_param(request.args, param_name='departement')

        query = GetListeOffresEmploiQuery(page, limit, search_term, departement)

        offres_emploi_query_model = get_liste_offres_emploi_query_handler.handle(query)

        return jsonify(offres_emploi_query_model.__dict__), 200
    except Exception as e:
        return handle_exception(e)


@offres_emploi.route('/offres-emploi/<id_offre>', methods=['GET'])
def get_detail_offre_emploi(id_offre: str):
    log_headers()

    try:
        query = GetDetailOffreEmploiQuery(id_offre)

        offre_emploi_query_model = get_detail_offre_emploi_query_handler.handle(query)

        if not offre_emploi_query_model:
            return generate_error_response(f'Offre d\'emploi {id_offre} not found', 404)
        return jsonify(offre_emploi_query_model.__dict__), 200
    except Exception as e:
        return handle_exception(e)
