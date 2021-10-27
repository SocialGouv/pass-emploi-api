from flask import Blueprint

from initialize_use_cases import offres_emploi_use_case
from network.headers_logger import log_headers

offres_emploi = Blueprint('offres_emploi', __name__)


@offres_emploi.route('/offres-emploi', methods=['GET'])
def get_offres_emploi():
    log_headers()

    res = offres_emploi_use_case.get_offres_emploi()
    return res.to_json(), 200
